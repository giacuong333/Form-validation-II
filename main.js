function Validator(formSelector, options = {}) {
  // Get name as a key and rule as a value
  var formRules = {};

  /*
          Self-convention: 
          - if there are errors -> return error message
          - if there is no error -> return undefined
  */

  var validatorRules = {
    required: function (value) {
      return value ? undefined : "Vui lòng nhập trường này";
    },
    email: function (value) {
      var regex = /^\w+@[a-zA-Z_]+?\.[a-zA-Z]{2,3}$/;
      return regex.test(value) ? undefined : "Email không đúng định dạng";
    },
    min: function (min) {
      return function (value) {
        return value.length >= min ? undefined : `Mật khẩu tối thiểu ${min} kí tự`;
      };
    },
    max: function (min) {
      return function (value) {
        return value.length <= max ? undefined : `Mật khẩu tối đa ${max} kí tự`;
      };
    },
  };

  var formElement = document.querySelector(formSelector);

  if (formElement) {
    var inputs = formElement.querySelectorAll("[name][rules]");

    for (var input of inputs) {
      var rules = input.getAttribute("rules").split("|");

      for (var rule of rules) {
        var ruleInfo;
        var ruleHasValue = rule.includes(":");

        if (ruleHasValue) {
          ruleInfo = rule.split(":");
          rule = ruleInfo[0];
        }

        var ruleFunc = validatorRules[rule];

        if (ruleHasValue) {
          ruleFunc = ruleFunc(ruleInfo[1]);
        }

        if (Array.isArray(formRules[input.name])) {
          formRules[input.name].push(ruleFunc);
        } else {
          formRules[input.name] = [ruleFunc];
        }
      }

      // Listen for validating (blur, onchange...)
      input.onblur = handleValidate;
      input.oninput = handleClearError;
    }

    // Function to conduct validate
    function handleValidate(event) {
      var rules = formRules[event.target.name];
      var errorMessage;

      rules.find((rule) => {
        errorMessage = rule(event.target.value);
        return errorMessage;
      });

      // If there are errors -> display error message
      if (errorMessage) {
        var formGroup = event.target.closest(".form-group");

        if (formGroup) {
          formGroup.querySelector(".form-message").innerText = errorMessage;
          formGroup.classList.add("invalid");
        }
      }

      return !errorMessage;
    }

    function handleClearError(event) {
      var formGroup = event.target.closest(".form-group");

      if (formGroup.classList.contains("invalid")) {
        formGroup.querySelector(".form-message").innerText = "";
        formGroup.classList.remove("invalid");
      }
    }
  }

  // Handle the submit behavior
  formElement.onsubmit = function (event) {
    event.preventDefault();

    var inputs = formElement.querySelectorAll("[name][rules]");
    var isValid = true;

    for (var input of inputs) {
      if (!handleValidate({ target: input })) {
        isValid = false;
      }
    }

    // When there is no error -> submit form
    if (isValid) {
      if (typeof options.onSubmit === "function") {
        var enableInputs = formElement.querySelectorAll("[name]:not([disabled])");
        var formValues = Array.from(enableInputs).reduce((value, input) => {
          switch (input.type) {
            case "radio":
              value[input.name] = formElement.querySelector(`input[name='${input.name}']:checked`).value;
              break;

            case "checkbox":
              if (!input.matches(":checked")) {
                value[input.name] = "";
                return value;
              }

              if (!Array.isArray(value[input.name])) {
                value[input.name] = [];
              }

              value[input.name].push(input.value);

              break;
            case "file":
              value[input.name] = input.files;
              break;
            default:
              value[input.name] = input.value;
          }
          return value;
        }, {});
        options.onSubmit(formValues);
      } else {
        formElement.submit();
      }
    }
  };
}
