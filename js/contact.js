document.getElementById('contact-form').addEventListener('submit', function(event) {
    event.preventDefault();
  
    let form = event.target;
    let data = new FormData(form);
    let output = document.getElementById('form-feedback');
  
    fetch(form.action, {
      method: form.method,
      body: data,
      headers: {
        'Accept': 'application/json'
      }
    }).then(response => {
      if (response.ok) {
        output.classList.add('form-success');
        output.classList.remove('form-error');
        output.innerHTML = "Thank you for your submission!";
        form.reset();
      } else {
        output.classList.add('form-error');
        output.classList.remove('form-success');
        response.json().then(data => {
          if (data.errors) {
            output.innerHTML = data.errors.join(", ");
          } else {
            output.innerHTML = "Oops! There was a problem submitting your form";
          }
        });
      }
    }).catch(error => {
      output.classList.add('form-error');
      output.classList.remove('form-success');
      output.innerHTML = "Oops! There was a problem submitting your form";
    });
  });
  