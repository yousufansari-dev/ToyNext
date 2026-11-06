document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('contact-form');
  const feedback = document.getElementById('contact-feedback');
  form.addEventListener('submit', event => {
    event.preventDefault();
    feedback.classList.add('d-none');
    if (!form.checkValidity()) {
      form.classList.add('was-validated');
      form.querySelector(':invalid')?.focus();
      return;
    }
    feedback.className = 'alert alert-success';
    feedback.textContent = 'Thanks for your note! This frontend demo does not send messages to a real server.';
    form.reset();
    form.classList.remove('was-validated');
  });
});
