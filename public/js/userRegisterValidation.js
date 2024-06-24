async function validate() {
   // Input fields
   const name = document.getElementById('name');
   const email = document.getElementById('email');
   const password = document.getElementById('password');
   const confirmPassword = document.getElementById('confirmPassword');
   const mobile = document.getElementById('mobile');

   // Error fields
   const nameError = document.getElementById('nameError');
   const emailError = document.getElementById('emailError');
   const passwordError = document.getElementById('passwordError');
   const confirmPasswordError = document.getElementById('confirmPasswordError');
   const mobileError = document.getElementById('mobileError');

   // Regex
   const nameRegex = /^[A-Z]/;
   const emailRegex = /^[a-zA-Z0-9._%+-]+@gmail+\.[a-zA-Z]{3}$/;
   const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
   const mobileRegex = /^[0-9]{10}$/;

   // Name field
   if (name.value.trim() === '') {
      nameError.innerHTML = 'Field is required';
      setTimeout(() => {
         nameError.innerHTML = '';
      }, 5000);
      return false;
   }
   if (!nameRegex.test(name.value)) {
      nameError.innerHTML = 'First letter should be capital';
      setTimeout(() => {
         nameError.innerHTML = '';
      }, 5000);
      return false;
   }

   // Email field
   if (email.value.trim() === '') {
      emailError.innerHTML = 'Field is required';
      setTimeout(() => {
         emailError.innerHTML = '';
      }, 5000);
      return false;
   }
   if (!emailRegex.test(email.value)) {
      emailError.innerHTML = 'Please enter a valid email';
      setTimeout(() => {
         emailError.innerHTML = '';
      }, 5000);
      return false;
   }

   // Password field
   if (password.value.trim() === '') {
      passwordError.innerHTML = 'Field is required';
      setTimeout(() => {
         passwordError.innerHTML = '';
      }, 5000);
      return false;
   }
   if (!passwordRegex.test(password.value)) {
      passwordError.innerHTML = 'Please enter a strong password (minimum 8 characters, at least one uppercase letter, one lowercase letter, and one digit)';
      setTimeout(() => {
         passwordError.innerHTML = '';
      }, 5000);
      return false;
   }

   // Confirm Password field
   if (confirmPassword.value.trim() === '') {
      confirmPasswordError.innerHTML = 'Field is required';
      setTimeout(() => {
         confirmPasswordError.innerHTML = '';
      }, 5000);
      return false;
   }
   if (confirmPassword.value !== password.value) {
      confirmPasswordError.innerHTML = 'Passwords do not match';
      setTimeout(() => {
         confirmPasswordError.innerHTML = '';
      }, 5000);
      return false;
   }

   // Mobile field
   if (mobile.value.trim() === '') {
      mobileError.innerHTML = 'Field is required';
      setTimeout(() => {
         mobileError.innerHTML = '';
      }, 5000);
      return false;
   }
   if (!mobileRegex.test(mobile.value)) {
      mobileError.innerHTML = 'Please enter a valid 10-digit mobile number';
      setTimeout(() => {
         mobileError.innerHTML = '';
      }, 5000);
      return false;
   }

   // Check if mobile number already exists
   const response = await fetch('/checkMobile', {
      method: 'POST',
      headers: {
         'Content-Type': 'application/json'
      },
      body: JSON.stringify({ mobile: mobile.value })
   });

   const data = await response.json();

   if (!data.unique) {
      // Mobile number already exists
      mobileError.innerHTML = 'Mobile number already exists';
      setTimeout(() => {
         mobileError.innerHTML = '';
      }, 5000);
      return false;
   }

   return true;
}
