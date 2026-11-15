/*
  contact.js — validation for the form on contact.html.

  When the form is submitted:
    1. stop the browser from submitting it (there is no server);
    2. check every field with its rule from the `fields` array;
    3. show each error next to its field and mark the field aria-invalid;
    4. if anything failed, focus the first invalid field;
    5. if everything passed, show an honest success message.
  Nothing typed into this form is stored or sent anywhere.
*/

// A reasonable email pattern: something@something.something, with no spaces.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Digits only, from start (^) to end ($). A leading 0 is fine.
const DIGITS_PATTERN = /^[0-9]+$/;

const contactForm = document.getElementById("contact-form");
const formStatus = document.getElementById("form-status");

/* Each field has a rule: a function that returns an error message,
   or an empty string when the value is valid. */
const fields = [
  {
    input: document.getElementById("contact-name"),
    error: document.getElementById("contact-name-error"),
    validate: function (value) {
      return value === "" ? "Please enter your name." : "";
    }
  },
  {
    input: document.getElementById("contact-email"),
    error: document.getElementById("contact-email-error"),
    validate: function (value) {
      if (value === "") return "Please enter your email address.";
      if (!EMAIL_PATTERN.test(value)) return "Enter an email address like name@example.com.";
      return "";
    }
  },
  {
    input: document.getElementById("contact-phone"),
    error: document.getElementById("contact-phone-error"),
    validate: function (value) {
      if (value === "") return "Please enter your phone number.";
      if (!DIGITS_PATTERN.test(value)) return "Use digits only – no spaces, dashes, brackets or +.";
      return "";
    }
  },
  {
    input: document.getElementById("contact-message"),
    error: document.getElementById("contact-message-error"),
    validate: function (value) {
      return value === "" ? "Please enter a message." : "";
    }
  }
];

/* Checks one field, shows or clears its error, and returns true if valid.
   trim() removes surrounding spaces, so "   " counts as empty. */
function checkField(field) {
  const message = field.validate(field.input.value.trim());
  field.error.textContent = message;
  if (message) {
    field.input.setAttribute("aria-invalid", "true");
    return false;
  }
  field.input.removeAttribute("aria-invalid");
  return true;
}

contactForm.addEventListener("submit", function (event) {
  event.preventDefault();

  let firstInvalid = null;
  fields.forEach(function (field) {
    const isValid = checkField(field);
    if (!isValid && firstInvalid === null) {
      firstInvalid = field.input;
    }
  });

  if (firstInvalid) {
    formStatus.className = "form-status form-status--error";
    formStatus.textContent = "Please fix the highlighted fields.";
    firstInvalid.focus();
    return;
  }

  formStatus.className = "form-status form-status--success";
  formStatus.textContent = "Your form has passed validation. This demonstration website does not send messages.";
  contactForm.reset();
});

/* After a field has shown an error, re-check it as the user types so the
   message disappears as soon as it is fixed. */
fields.forEach(function (field) {
  field.input.addEventListener("input", function () {
    if (field.input.getAttribute("aria-invalid") === "true") {
      checkField(field);
    }
  });
});
