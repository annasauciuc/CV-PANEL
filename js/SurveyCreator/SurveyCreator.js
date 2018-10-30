const SurveyCreator = (function() {
  let instance;

  function init() {
    let surveyForm;

    const surveyApiData = {
      header: {
        title: "",
        subtitle: "",
        startDate: "",
        endDate: "",
        description: ""
      },
      elements: []
    };

    function construct(container) {
      $.get("../../html/SurveyCreator.html", function(htmlSkeleton) {
        surveyForm = container.empty().append(htmlSkeleton);
        _setupInternalEventListeners(surveyForm);
      }).fail(function(err) {
        throw new Error(err);
      });

      function _setupInternalEventListeners(form) {
        $surveyContainer = form.find("#survey-element");
        form.off("submit").on("submit", _buildJSON);

        $surveyContainer
          .find(".Survey-TypeSelector")
          .children("select.SelectedType-Select")
          .off("change")
          .on("change", _typeSelect);

        $surveyContainer
          .find(".Survey-TypeSelector > button.addNewElement")
          .off("click")
          .on("click", _newFieldValue);
      }

      function _removeRow(element) {
        if (window.confirm("Are you sure to delete this selector")) {
          element.closest("tr").remove();
        }
      }

      function _parentActions(event) {
        const button = $(event.currentTarget);
        if (button.hasClass("delete")) {
          _removeRow(button);
        } else {
          const $input = button.parent().siblings("input[type=text]");
          _appendOptionToParent($input);
        }
      }

      function _appendOptionToParent(input) {
        const inputValue = input.val().trim();

        if (inputValue !== "" && inputValue.length > 0) {
          const previewList = input
            .parent()
            .siblings(".preview-group")
            .find(" ul.preview-list");

          previewList
            .append(
              `<li class="list-group-item list-group-item-light d-flex justify-content-between align-items-center py-1 px-1">
                <span class="FieldValue">${inputValue}</span>
                <div class="btn-group btn-group" role="group">
                  <button type="button" class="btn btn-outline-primary editOption" data-value="${inputValue}" title="Edit this option"><i class="far fa-edit"></i></button>
                  <button type="button" class="btn btn-outline-danger deleteOption" title="Delete this option" data-value=${inputValue}><i class="far fa-trash-alt"></i></button>
                </div>
               </li>`
            )
            .off("click")
            .on("click", "button", _childrenActions);
        }
      }

      function _childrenActions(event) {
        const button = $(event.currentTarget);
        if (button.hasClass("editOption")) {
          _editOption(button);
        } else {
          _deleteOption(button);
        }
      }

      function _editOption(editButton) {
        const buttonIcon = editButton.find("i");
        const editableField = editButton.parent().siblings("span");

        const optionValue = editButton.data("value");

        if (buttonIcon.hasClass("fa-edit")) {
          buttonIcon.removeClass("far fa-edit").addClass("fas fa-check");

          editableField
            .prop("contenteditable", true)
            .focus()
            .css({ fontSize: "1.2em", width: "100%" });
        } else {
          buttonIcon.removeClass("fas fa-check").addClass("far fa-edit");
          const editableFieldText = editableField.text().trim();

          editableField.prop("contenteditable", false).css("font-size", "1em");

          editButton.data("value", editableFieldText);
        }
      }

      function _deleteOption(deleteButton) {
        if (window.confirm("Are you sure to delete this option?")) {
          deleteButton.closest("li").remove();
        }
      }

      function _newFieldValue(event) {
        const typeSelectorValue = $(event.currentTarget)
          .siblings("select.SelectedType-Select")
          .val();

        const tableBody = $("#survey-element > table").find(
          "tbody.Survey-TableBody"
        );

        switch (typeSelectorValue) {
          case "date":
          case "text":
          case "color":
          case "telephone":
          case "file":
            tableBody
              .append(
                `<tr class="ValueType-data" data-type=${typeSelectorValue}>
           <td>
            <div class="form-group w-100">
              <label class="w-100">
                <p contenteditable="true">You can modify this text</p>
                  <div class="input-group">
                    <input type="${typeSelectorValue}" name="input_${typeSelectorValue}[]"
                      class="form-control" placeholder="Insert default value" />
                    <div class="input-group-append">
                      <button type="button" class="btn btn-outline-danger delete">
                         <i class="far fa-trash-alt"></i>
                      </button>
                    </div>
              </label>
             </div>
            </td>
          </tr>`
              )
              .find("button.delete")
              .off("click")
              .on("click", _deleteInput);
            break;
          case "select":
          case "checkbox":
          case "radio":
            tableBody
              .append(
                `<tr class="ValueType-data" data-type=${typeSelectorValue}>
                <td>
                    <div class="form-group">
                    <p contenteditable="true">You can modify this text</p>
                      <div class="input-group">
                        <input name="${typeSelectorValue}[]" class="form-control"
                         type="text" placeholder="New ${typeSelectorValue} value..."/>
                        <div class="input-group-append">
                          <button type="button" class="btn btn-outline-primary Actions add">Add option</button>
                        </div>
                      </div>
                    <div class="container preview-group my-2">
                      <ul class="list-group preview-list my-1 px-1 py-1"></ul>
                    </div>
                  </div>
                  <div class="button-actions text-right">
                     <button type="button" class="btn btn-outline-danger btn-block Actions delete" type="button">
                         Delete
                         <i class="far fa-trash-alt"></i>
                      </button>
                  </div>
                </td>
                </tr>`
              )
              .find("button.Actions")
              .off("click")
              .on("click", _parentActions);
            break;
        }
      }

      function _typeSelect(event) {
        const typeSelector = $(event.currentTarget);
        const addButton = typeSelector.siblings("button.addNewElement");

        addButton.html(`Add new ${typeSelector.val()} on the survey
        <i class="fas fa-plus-square"></i>`);
      }
      function _deleteInput(event) {
        if (window.confirm("Are you sure to delete this input element?")) {
          $(event.currentTarget)
            .closest("tr")
            .remove();
        }
      }

      function _setHeaderSurveyData() {
        surveyForm
          .find(".SurveyHeader-Data")
          .find("input, textarea")
          .each((index, element) => {
            const $element = $(element);
            if ($element.prop("type") === "date") {
              const date = new Date($element.val()).getTime();
              surveyApiData["header"][$element.prop("name")] = isNaN(date)
                ? ""
                : date;
            } else {
              surveyApiData["header"][$element.prop("name")] = $element.val();
            }
          });
      }

      function _setBodySurveyData() {
        const dinamicElements = ["select", "radio", "checkbox"];

        surveyForm
          .find("table tbody")
          .children("tr.ValueType-data")
          .each((index, element) => {
            const $element = $(element);
            const data = {
              type: $element.data("type"),
              title: $element.find(".form-group p").text(),
              values: []
            };
            if (dinamicElements.includes(data["type"])) {
              data["values"] = Array.from(
                $element.find("ul.preview-list > li")
              ).map(value =>
                $(value)
                  .children(".FieldValue")
                  .text()
              );
            } else {
              data["values"].push($element.find("input").val());
            }

            surveyApiData["elements"].push(data);
          });
      }

      function _buildJSON(event) {
        event.preventDefault();
        _setHeaderSurveyData();
        _setBodySurveyData();
        console.log(JSON.stringify(surveyApiData));
      }
    }
    return {
      construct
    };
  }

  return {
    getInstance: function() {
      if (!instance) {
        instance = init();
      }
      return instance;
    }
  };
})();

const surveyCreator = SurveyCreator.getInstance();
