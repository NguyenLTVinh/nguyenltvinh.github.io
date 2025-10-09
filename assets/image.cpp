// CSCI 5607 HW 2 - Image Conversion Instructor: S. J. Guy <sjguy@umn.edu>
// In this assignment you will load and convert between various image formats.
// Additionally, you will manipulate the stored image data by quantizing,
// cropping, and suppressing channels

#include "image.h"
#include <float.h>
#include <math.h>
#include <stdlib.h>
#include <string.h>
#include <vector>

#include <fstream>
using namespace std;

/**
 * Image
 **/
Image::Image(int width_, int height_) {

  assert(width_ > 0);
  assert(height_ > 0);

  width = width_;
  height = height_;
  num_pixels = width * height;
  sampling_method = IMAGE_SAMPLING_POINT;

  data.raw = new uint8_t[num_pixels * 4];
  int b = 0; // which byte to write to
  for (int j = 0; j < height; j++) {
    for (int i = 0; i < width; i++) {
      data.raw[b++] = 0;
      data.raw[b++] = 0;
      data.raw[b++] = 0;
      data.raw[b++] = 0;
    }
  }

  assert(data.raw != NULL);
}

Image::Image(const Image &src) {
  width = src.width;
  height = src.height;
  num_pixels = width * height;
  sampling_method = IMAGE_SAMPLING_POINT;

  data.raw = new uint8_t[num_pixels * sizeof(Pixel)];

  memcpy(data.raw, src.data.raw, num_pixels * sizeof(Pixel));
}

Image::Image(char *fname) {

  int numComponents; //(e.g., Y, YA, RGB, or RGBA)

  // Load the pixels with STB Image Lib
  uint8_t *loadedPixels = stbi_load(fname, &width, &height, &numComponents, 4);
  if (loadedPixels == NULL) {
    printf("Error loading image: %s", fname);
    exit(-1);
  }

  // Set image member variables
  num_pixels = width * height;
  sampling_method = IMAGE_SAMPLING_POINT;

  // Copy the loaded pixels into the image data structure
  data.raw = new uint8_t[num_pixels * sizeof(Pixel)];
  memcpy(data.raw, loadedPixels, num_pixels * sizeof(Pixel));
  free(loadedPixels);
}

Image::~Image() {
  delete[] data.raw;
  data.raw = NULL;
}

void Image::Write(char *fname) {

  int lastc = strlen(fname);

  switch (fname[lastc - 1]) {
  case 'g': // jpeg (or jpg) or png
    if (fname[lastc - 2] == 'p' || fname[lastc - 2] == 'e')  // jpeg or jpg
      stbi_write_jpg(fname, width, height, 4, data.raw, 95); // 95% jpeg quality
    else                                                     // png
      stbi_write_png(fname, width, height, 4, data.raw, width * 4);
    break;
  case 'a': // tga (targa)
    stbi_write_tga(fname, width, height, 4, data.raw);
    break;
  case 'p': // bmp
  default:
    stbi_write_bmp(fname, width, height, 4, data.raw);
  }
}

void Image::Brighten(double factor) {
  int x, y;
  for (x = 0; x < Width(); x++) {
    for (y = 0; y < Height(); y++) {
      Pixel p = GetPixel(x, y);
      Pixel scaled_p = p * factor;
      GetPixel(x, y) = scaled_p;
    }
  }
}

void Image::ExtractChannel(int channel) {
  for (int y = 0; y < height; y++) {
    for (int x = 0; x < width; x++) {
      Pixel p = GetPixel(x, y);
      switch (channel) {
      case IMAGE_CHANNEL_RED:
        p.g = 0;
        p.b = 0;
        break;
      case IMAGE_CHANNEL_GREEN:
        p.r = 0;
        p.b = 0;
        break;
      case IMAGE_CHANNEL_BLUE:
        p.r = 0;
        p.g = 0;
        break;
      default:
        p.r = 0;
        p.g = 0;
        p.b = 0;
      }
      GetPixel(x, y) = p;
    }
  }
}

void Image::Quantize(int nbits) {
  for (int y = 0; y < height; y++) {
    for (int x = 0; x < width; x++) {
      Pixel p = GetPixel(x, y);
      Pixel q = PixelQuant(p, nbits);
      GetPixel(x, y) = q;
    }
  }
}

Image *Image::Crop(int x, int y, int w, int h) {
  assert(x >= 0 && y >= 0 && x + w <= width && y + h <= height);
  Image *dst = new Image(w, h);
  for (int j = 0; j < h; j++) {
    for (int i = 0; i < w; i++) {
      dst->SetPixel(i, j, GetPixel(x + i, y + j));
    }
  }
  return dst;
}

void Image::AddNoise(double factor) {
  if (factor < 0.0)
    factor = 0.0;
  if (factor > 1.0)
    factor = 1.0;
  for (int y = 0; y < height; y++) {
    for (int x = 0; x < width; x++) {
      Pixel p = GetPixel(x, y);
      Pixel rn = PixelRandom();
      int nr = p.r + static_cast<int>((rn.r - 128) * factor);
      int ng = p.g + static_cast<int>((rn.g - 128) * factor);
      int nb = p.b + static_cast<int>((rn.b - 128) * factor);
      p.r = ComponentClamp(nr);
      p.g = ComponentClamp(ng);
      p.b = ComponentClamp(nb);
      SetPixel(x, y, p);
    }
  }
}

void Image::ChangeContrast(double factor) {
  long totalLum = 0;
  for (int y = 0; y < height; y++) {
    for (int x = 0; x < width; x++) {
      totalLum += GetPixel(x, y).Luminance();
    }
  }

  Component avg = ComponentClamp((int)(totalLum / num_pixels));
  Pixel gray(avg, avg, avg);

  for (int y = 0; y < height; y++) {
    for (int x = 0; x < width; x++) {
      Pixel p = GetPixel(x, y);
      Pixel adjusted = PixelLerp(gray, p, factor);
      SetPixel(x, y, adjusted);
    }
  }
}

void Image::ChangeSaturation(double factor) {
  for (int y = 0; y < height; y++) {
    for (int x = 0; x < width; x++) {
      Pixel p = GetPixel(x, y);
      Component lum = p.Luminance();
      Pixel gray(lum, lum, lum);
      Pixel adjusted = PixelLerp(gray, p, factor);
      SetPixel(x, y, adjusted);
    }
  }
}

// For full credit, check that your dithers aren't making the pictures
// systematically brighter or darker
void Image::RandomDither(int nbits) {
  int levels = 1 << nbits;
  float step = 255.0f / (levels - 1);
  for (int y = 0; y < height; y++) {
    for (int x = 0; x < width; x++) {
      Pixel p = GetPixel(x, y);
      float threshold = rand() / (float)RAND_MAX;
      int ir = int(floor((p.r / 255.0f) * (levels - 1) + threshold));
      ir = (ir < 0 ? 0 : (ir >= levels ? levels - 1 : ir));
      p.r = ComponentClamp((int)floor(ir * step + 0.5f));
      int ig = int(floor((p.g / 255.0f) * (levels - 1) + threshold));
      ig = (ig < 0 ? 0 : (ig >= levels ? levels - 1 : ig));
      p.g = ComponentClamp((int)floor(ig * step + 0.5f));
      int ib = int(floor((p.b / 255.0f) * (levels - 1) + threshold));
      ib = (ib < 0 ? 0 : (ib >= levels ? levels - 1 : ib));
      p.b = ComponentClamp((int)floor(ib * step + 0.5f));
      SetPixel(x, y, p);
    }
  }
}

// This bayer method gives the quantization thresholds for an ordered dither.
// This is a 4x4 dither pattern, assumes the values are quantized to 16 levels.
// You can either expand this to a larger bayer pattern. Or (more likely), scale
// the threshold based on the target quantization levels.
static int Bayer4[4][4] = {
    {15, 7, 13, 5}, {3, 11, 1, 9}, {12, 4, 14, 6}, {0, 8, 2, 10}};

void Image::OrderedDither(int nbits) {
  int levels = 1 << nbits;
  float step = 255.0f / (levels - 1);
  for (int y = 0; y < height; y++) {
    for (int x = 0; x < width; x++) {
      Pixel p = GetPixel(x, y);
      int i = x & 3, j = y & 3;
      float threshold = (Bayer4[j][i] + 0.5f) / 16.0f;
      int ir = int(floor((p.r / 255.0f) * (levels - 1) + threshold));
      ir = (ir < 0 ? 0 : (ir >= levels ? levels - 1 : ir));
      p.r = ComponentClamp((int)floor(ir * step + 0.5f));
      int ig = int(floor((p.g / 255.0f) * (levels - 1) + threshold));
      ig = (ig < 0 ? 0 : (ig >= levels ? levels - 1 : ig));
      p.g = ComponentClamp((int)floor(ig * step + 0.5f));
      int ib = int(floor((p.b / 255.0f) * (levels - 1) + threshold));
      ib = (ib < 0 ? 0 : (ib >= levels ? levels - 1 : ib));
      p.b = ComponentClamp((int)floor(ib * step + 0.5f));
      SetPixel(x, y, p);
    }
  }
}

/* Error-diffusion parameters */
const double ALPHA = 7.0 / 16.0, BETA = 3.0 / 16.0, GAMMA = 5.0 / 16.0,
             DELTA = 1.0 / 16.0;

void Image::FloydSteinbergDither(int nbits) {
  int levels = 1 << nbits;
  float step = 255.0f / (levels - 1);
  int w = width, h = height;
  int n = num_pixels;
  float *rbuf = new float[n];
  float *gbuf = new float[n];
  float *bbuf = new float[n];
  for (int i = 0; i < n; i++) {
    Pixel p = data.pixels[i];
    rbuf[i] = p.r;
    gbuf[i] = p.g;
    bbuf[i] = p.b;
  }
  for (int y = 0; y < h; y++) {
    for (int x = 0; x < w; x++) {
      int idx = y * w + x;
      float oldr = rbuf[idx];
      int qr = int(floor(oldr / step + 0.5f));
      qr = (qr < 0 ? 0 : (qr >= levels ? levels - 1 : qr));
      float newr = qr * step;
      float errr = oldr - newr;
      rbuf[idx] = newr;
      float oldg = gbuf[idx];
      int qg = int(floor(oldg / step + 0.5f));
      qg = (qg < 0 ? 0 : (qg >= levels ? levels - 1 : qg));
      float newg = qg * step;
      float errg = oldg - newg;
      gbuf[idx] = newg;
      float oldb = bbuf[idx];
      int qb = int(floor(oldb / step + 0.5f));
      qb = (qb < 0 ? 0 : (qb >= levels ? levels - 1 : qb));
      float newb = qb * step;
      float errb = oldb - newb;
      bbuf[idx] = newb;
      if (x + 1 < w) {
        rbuf[idx + 1] += errr * ALPHA;
        gbuf[idx + 1] += errg * ALPHA;
        bbuf[idx + 1] += errb * ALPHA;
      }
      if (x - 1 >= 0 && y + 1 < h) {
        int id = idx + w - 1;
        rbuf[id] += errr * BETA;
        gbuf[id] += errg * BETA;
        bbuf[id] += errb * BETA;
      }
      if (y + 1 < h) {
        int id = idx + w;
        rbuf[id] += errr * GAMMA;
        gbuf[id] += errg * GAMMA;
        bbuf[id] += errb * GAMMA;
      }
      if (x + 1 < w && y + 1 < h) {
        int id = idx + w + 1;
        rbuf[id] += errr * DELTA;
        gbuf[id] += errg * DELTA;
        bbuf[id] += errb * DELTA;
      }
    }
  }
  for (int i = 0; i < n; i++) {
    Pixel p = data.pixels[i];
    p.r = ComponentClamp((int)floor(rbuf[i] + 0.5f));
    p.g = ComponentClamp((int)floor(gbuf[i] + 0.5f));
    p.b = ComponentClamp((int)floor(bbuf[i] + 0.5f));
    data.pixels[i] = p;
  }
  delete[] rbuf;
  delete[] gbuf;
  delete[] bbuf;
}

void Image::Blur(int n) {
  assert(n > 0 && (n % 2) == 1);
  int k = n / 2;
  double sigma = n / 2.0;
  vector<double> kernel(n * n);
  double sumW = 0.0;
  for (int j = 0; j < n; j++) {
    for (int i = 0; i < n; i++) {
      int dj = j - k;
      int di = i - k;
      double w = exp(-(di * di + dj * dj) / (2 * sigma * sigma));
      kernel[j * n + i] = w;
      sumW += w;
    }
  }
  for (double &w : kernel) {
    w /= sumW;
  }
  Pixel *orig = new Pixel[num_pixels];
  memcpy(orig, data.pixels, sizeof(Pixel) * num_pixels);
  for (int y = 0; y < height; y++) {
    for (int x = 0; x < width; x++) {
      double rSum = 0, gSum = 0, bSum = 0, wSum = 0;
      for (int j = 0; j < n; j++) {
        int yy = y + j - k;
        if (yy < 0 || yy >= height)
          continue;
        for (int i = 0; i < n; i++) {
          int xx = x + i - k;
          if (xx < 0 || xx >= width)
            continue;
          double w = kernel[j * n + i];
          Pixel p = orig[yy * width + xx];
          rSum += p.r * w;
          gSum += p.g * w;
          bSum += p.b * w;
          wSum += w;
        }
      }
      Pixel out;
      out.r = ComponentClamp((int)floor(rSum / wSum + 0.5));
      out.g = ComponentClamp((int)floor(gSum / wSum + 0.5));
      out.b = ComponentClamp((int)floor(bSum / wSum + 0.5));
      out.a = GetPixel(x, y).a;
      SetPixel(x, y, out);
    }
  }
  delete[] orig;
}

void Image::Sharpen(int n) {
  Image *blurred = new Image(*this);
  blurred->Blur(n);
  for (int y = 0; y < height; y++) {
    for (int x = 0; x < width; x++) {
      Pixel orig = GetPixel(x, y);
      Pixel b = blurred->GetPixel(x, y);
      int rr = 2 * orig.r - b.r;
      int gg = 2 * orig.g - b.g;
      int bb = 2 * orig.b - b.b;
      Pixel p;
      p.r = ComponentClamp(rr);
      p.g = ComponentClamp(gg);
      p.b = ComponentClamp(bb);
      p.a = orig.a;
      SetPixel(x, y, p);
    }
  }
  delete blurred;
}

void Image::EdgeDetect() {
  // Sobel edge detection on luminance
  static int kx[3][3] = {{-1, 0, 1}, {-2, 0, 2}, {-1, 0, 1}};
  static int ky[3][3] = {{-1, -2, -1}, {0, 0, 0}, {1, 2, 1}};
  Pixel *orig = new Pixel[num_pixels];
  memcpy(orig, data.pixels, num_pixels * sizeof(Pixel));
  for (int y = 0; y < height; y++) {
    for (int x = 0; x < width; x++) {
      int gx = 0, gy = 0;
      for (int j = -1; j <= 1; j++) {
        int yy = y + j;
        if (yy < 0)
          yy = 0;
        else if (yy >= height)
          yy = height - 1;
        for (int i = -1; i <= 1; i++) {
          int xx = x + i;
          if (xx < 0)
            xx = 0;
          else if (xx >= width)
            xx = width - 1;
          int lum = orig[yy * width + xx].Luminance();
          gx += kx[j + 1][i + 1] * lum;
          gy += ky[j + 1][i + 1] * lum;
        }
      }
      int mag = (int)floor(sqrt(gx * gx + gy * gy) + 0.5);
      Component c = ComponentClamp(mag);
      data.pixels[y * width + x] = Pixel(c, c, c, orig[y * width + x].a);
    }
  }
  delete[] orig;
}

Image *Image::Scale(double sx, double sy) {
  int newW = ComponentClamp((int)floor(width * sx + 0.5));
  int newH = ComponentClamp((int)floor(height * sy + 0.5));
  assert(newW > 0 && newH > 0);
  Image *dst = new Image(newW, newH);
  for (int y = 0; y < newH; y++) {
    for (int x = 0; x < newW; x++) {
      double u = x / sx;
      double v = y / sy;
      if (u < 0)
        u = 0;
      if (u >= width - 1)
        u = width - 1;
      if (v < 0)
        v = 0;
      if (v >= height - 1)
        v = height - 1;
      Pixel p = Sample(u, v);
      dst->SetPixel(x, y, p);
    }
  }
  return dst;
}

Image *Image::Rotate(double angle) {
  double theta = angle * M_PI / 180.0;
  double cosT = cos(theta), sinT = sin(theta);
  int newW = width;
  int newH = height;
  Image *dst = new Image(newW, newH);
  double cx = width * 0.5, cy = height * 0.5;
  for (int y = 0; y < newH; y++) {
    for (int x = 0; x < newW; x++) {
      double dx = x - cx;
      double dy = y - cy;
      double u = cosT * dx + sinT * dy + cx;
      double v = -sinT * dx + cosT * dy + cy;
      if (u < 0 || u >= width || v < 0 || v >= height) {
        dst->SetPixel(x, y, Pixel(0, 0, 0, 255));
      } else {
        Pixel p = Sample(u, v);
        dst->SetPixel(x, y, p);
      }
    }
  }
  return dst;
}

void Image::Fun() { /* WORK HERE */ }

/**
 * Image Sample
 **/
void Image::SetSamplingMethod(int method) {
  assert((method >= 0) && (method < IMAGE_N_SAMPLING_METHODS));
  sampling_method = method;
}

Pixel Image::Sample(double u, double v) {
  // Point sampling
  if (sampling_method == IMAGE_SAMPLING_POINT) {
    int xi = (int)floor(u + 0.5);
    int yi = (int)floor(v + 0.5);
    if (xi < 0)
      xi = 0;
    if (xi >= width)
      xi = width - 1;
    if (yi < 0)
      yi = 0;
    if (yi >= height)
      yi = height - 1;
    return GetPixel(xi, yi);
  }
  // Bilinear sampling
  if (sampling_method == IMAGE_SAMPLING_BILINEAR) {
    int x0 = (int)floor(u), y0 = (int)floor(v);
    int x1 = x0 + 1, y1 = y0 + 1;
    double dx = u - x0, dy = v - y0;
    if (x0 < 0)
      x0 = 0;
    if (x1 < 0)
      x1 = 0;
    if (y0 < 0)
      y0 = 0;
    if (y1 < 0)
      y1 = 0;
    if (x0 >= width)
      x0 = width - 1;
    if (x1 >= width)
      x1 = width - 1;
    if (y0 >= height)
      y0 = height - 1;
    if (y1 >= height)
      y1 = height - 1;
    Pixel p00 = GetPixel(x0, y0);
    Pixel p10 = GetPixel(x1, y0);
    Pixel p01 = GetPixel(x0, y1);
    Pixel p11 = GetPixel(x1, y1);
    Pixel p0 = PixelLerp(p00, p10, dx);
    Pixel p1 = PixelLerp(p01, p11, dx);
    return PixelLerp(p0, p1, dy);
  }
  // Gaussian sampling (3x3 Gaussian kernel)
  int r = 1;
  static const int gw[3][3] = {{1, 2, 1}, {2, 4, 2}, {1, 2, 1}};
  double wsum = 16.0;
  double xf = floor(u), yf = floor(v);
  double sumR = 0, sumG = 0, sumB = 0;
  for (int j = -r; j <= r; j++) {
    int yy = (int)yf + j;
    if (yy < 0)
      yy = 0;
    if (yy >= height)
      yy = height - 1;
    for (int i = -r; i <= r; i++) {
      int xx = (int)xf + i;
      if (xx < 0)
        xx = 0;
      if (xx >= width)
        xx = width - 1;
      double w = gw[j + r][i + r];
      Pixel p = GetPixel(xx, yy);
      sumR += p.r * w;
      sumG += p.g * w;
      sumB += p.b * w;
    }
  }
  Pixel out;
  out.r = ComponentClamp((int)floor(sumR / wsum + 0.5));
  out.g = ComponentClamp((int)floor(sumG / wsum + 0.5));
  out.b = ComponentClamp((int)floor(sumB / wsum + 0.5));
  out.a = 255;
  return out;
}
