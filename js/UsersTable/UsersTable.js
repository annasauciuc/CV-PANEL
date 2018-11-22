/**
 * This class represents the table that manage users in the application
 * It's built based on the Singleton pattern
 * IMPORTANT: Functions where the name starts with  _ are private
 * Source: https://addyosmani.com/resources/essentialjsdesignpatterns/book/
 *
 * Return the Table instance initialized  and ready to be used as single access point.
 * @return {function} getInstance
 */

const Table = (function() {
  let instance;

  function init() {
    const mainContainer = $(".main-container");

    let apiUsers = "https://cv-mobile-api.herokuapp.com/api/users";
    let apiSkills = "https://cv-mobile-api.herokuapp.com/api/skills";
    let apiLanguages = "https://cv-mobile-api.herokuapp.com/api/langs";
    function construct(container) {
      $.get("../../html/UserTable.html", function(htmlSkeleton) {
        container.empty().append(htmlSkeleton);
        ApiMachine.request("/users", { method: "GET", callback: initTable });
        //.request("/skills", { method: "GET", callback: , storage: 'skills' });
        //ApiMachine.request("/langs", { method: "GET", callback: ,storage: 'langs' });
        //_setupSessionStorage(apiUsers, initTable);
        _setupSessionStorage(apiSkills);
        _setupSessionStorage(apiLanguages);
      }).fail(function(err) {
        _showOverlay(false);
        throw new Error(err);
      });
    }

    /**
     * Initialize all the object event listeners
     * @function _setupInternalEventListeners
     * @private
     */
    function _setupInternalEventListeners() {
      $(window).on("resize", function(e) {
        const width = this.innerWidth;
        renderDataOnResize(null, width);
      });

      $("div.main-container")
        .find("td.options")
        .off("click")
        .on("click", "button:not(.detail)", _optionButtonsEvent);

      $("#userModal").on("show.bs.modal", renderDataOnModal);
    }

    /**
     * This function choose the actions depends on the button that
     * fire the event
     * @function _optionButtonsEvent
     * @private
     * @param {object} event
     */
    function _optionButtonsEvent(event) {
      const button = $(event.currentTarget);
      const userID = button.data("id");
      if (button.hasClass("edit")) {
        userForm.editForm(getUserByID(userID));
      } else {
        if (window.confirm("Are you sure to delete this user?")) {
          deleteUser(userID);
        }
      }
    }

    /** Prepare sessionStorage that allow us save the data in client side to work with it
     * @function _setupSessionStorage
     * @private
     * @param {String} url - The url from where we get the resources we need about users
     * @param {function} callback - Callback that triggers when the response is ready
     */
    function _setupSessionStorage(url, callback) {
      if (!callback) {
        if (url.includes("langs")) {
          if (!sessionStorage.getItem("languages-list")) {
            apiRequest(url);
          }
        } else {
          if (!sessionStorage.getItem("skills-list")) {
            apiRequest(url);
          }
        }
      } else {
        if (!sessionStorage.getItem("users-list")) {
          apiRequest(url);
        } else {
          callback(null, window.innerWidth);
        }
      }
    }

    /**Make the API Request that give the users data and handle the
     * possible errors
     * @function apiRequest
     * @param {String} url
     * @param {function} callback
     */
    function apiRequest(url) {
      if (url.includes("langs")) {
        $.getJSON(url, function(response) {
          if (!response["error"]) {
            sessionStorage.setItem("languages-list", JSON.stringify(response));
          }
        }).fail(function(err) {
          _showOverlay(false);
          throw new Error(err);
        });
      } else if (url.includes("skills")) {
        $.getJSON(url, function(response) {
          if (!response["error"]) {
            sessionStorage.setItem("skills-list", JSON.stringify(response));
          }
        }).fail(function(err) {
          _showOverlay(false);
          throw new Error(err);
        });
      } else {
        _showOverlay(true);
        $.getJSON(url, function(response) {
          if (!response["error"]) {
            sessionStorage.setItem("users-list", JSON.stringify(response));
          }
        }).fail(function(err) {
          _showOverlay(false);
          throw new Error(err);
        });
      }
    }

    function _collect(data, key) {
      return data.map(item => {
        const key = item[keyToCollect];
        const itemCollected = {};
        delete item[keyToCollect];
        itemCollected[key] = item;
        return itemCollected;
      });
    }

    function _renderLangsAndSkills(user) {
      let skillsFromStorage = collect(
        JSON.parse(sessionStorage.getItem("skills")),
        "_id"
      );
      let langsFromStorage = collect(
        JSON.parse(sessionStorage.getItem("langs")),
        "_id"
      );

      const data = {
        skills: [],
        languages: []
      };

      Object.keys(user["skills"]).map(function(skillID) {
        if (key === "skills") {
          data["skills"] = skillsFromStorage.map(function(sessionSkill) {
            if (user[key].includes(sessionSkill._id)) {
              if (window.innerWidth <= 867) {
                return `<span class="badge badge-secondary mr-1">${
                  sessionSkill.label
                }</span>`;
              } else {
                return `<img class="mx-1 mt-2" src="../assets/images/${key}/${
                  sessionSkill.label
                }.png" alt="${
                  sessionSkill.label
                }" width="48" height="48" title="${sessionSkill.label}" />`;
              }
            }
          });
        } else if (key === "languages") {
          data["languages"] = langsFromStorage.map(function(sessionLang) {
            if (user[key].includes(sessionLang._id)) {
              if (window.innerWidth <= 867) {
                return `<span class="badge badge-secondary mr-1">${
                  sessionLang.label
                }</span>`;
              } else {
                return `<img class="mx-1 mt-2" src="../assets/images/${key}/${
                  sessionLang.label
                }.png" alt="${
                  sessionLang.label
                }" width="48" height="48" title="${sessionLang.label}" />`;
              }
            }
          });
        }
      });
      data.skills = Array.from(new Set(data.skills));
      data.languages = Array.from(new Set(data.languages));

      return data;
    }
    /** Display table with the users data when the instance is initialized
     * @function initTable
     * @public
     * @param {array} data - Array of JSON data
     */
    function initTable(data, browserWidth = window.innerWidth) {
      let users = data;
      if (browserWidth > 768) {
        _showOverlay(true);
        const tableBody = mainContainer.find("#users-table tbody");
        users.forEach(user => _appendRowData(tableBody, user));
      } else {
        mainContainer
          .find("#users-table")
          .hide()
          .find("tbody")
          .empty();
        let cardContainer = mainContainer.find("div#card-container");
        users.forEach(user => _appendCardData(cardContainer, user));
      }
      _showOverlay(false);
      _setupInternalEventListeners();
    }

    /**
     * Append a new HTML row into the specific container with the user data
     * @function _appendRowData
     * @private
     * @param {jQuery Object} tableBody
     * @param {Object} user
     */
    function _appendRowData(tableBody, user) {
      tableBody.append(_tableRowSkeleton(user));
    }

    /**
     * Append a new HTML Card element into the specific container with the user data
     * @function _appendCardData
     * @private
     * @param {jQuery Object} cardContainer
     * @param {Object} user
     */
    function _appendCardData(cardContainer, user) {
      cardContainer.append(_cardSkeleton(user));
    }

    /**
     * Handle the resize on the browser to render data in a new container
     * @function renderDataOnResize
     * @public
     * @param {Number} width
     */
    function renderDataOnResize(users = null, browserWidth, inputsData = []) {
      const mainTable = mainContainer.find("#users-table");
      const tableBody = mainTable.find("tbody");
      const cardContainer = mainContainer.find("div#card-container");

      let usersData = users || JSON.parse(sessionStorage.getItem("users-list"));

      if (browserWidth > 868) {
        if (inputsData.length > 0) {
          const filteredUsers = SearchFilter.filterUsers(inputsData, usersData);

          tableBody.empty();
          _showOverlay(true);

          setTimeout(() => {
            _showOverlay(false);
            filteredUsers.forEach(user => _appendRowData(tableBody, user));
          }, 1000);
        }

        if (tableBody.children("tr").length === 0 && inputsData.length === 0) {
          _renderTableOnResize(mainTable, cardContainer, usersData);
          _showOverlay(false);
        }
      } else if (browserWidth < 868) {
        if (inputsData.length > 0) {
          const filteredUsers = SearchFilter.filterUsers(inputsData, usersData);

          cardContainer.empty();
          _showOverlay(true);

          setTimeout(() => {
            _showOverlay(false);
            filteredUsers.forEach(user => _appendCardData(cardContainer, user));
          }, 1000);
        }

        if (
          cardContainer.children(".user-card").length === 0 &&
          inputsData.length === 0
        ) {
          _renderCardOnResize(mainTable, cardContainer, usersData);
          _showOverlay(false);
        }
      }
    }
    /**
     * @function _renderTableOnResize
     * @private
     * @param {jQuery Object} mainTable
     * @param {jQuery Object} cardContainer
     * @param {Array} users
     */
    function _renderTableOnResize(mainTable, cardContainer, users) {
      cardContainer.empty();
      mainTable.show();
      const tableBody = mainTable.find("tbody");
      users.forEach(user => _appendRowData(tableBody, user));
    }

    /**
     * @function _renderCardOnResize
     * @private
     * @param {jQuery Object} mainTable
     * @param {jQuery Object} cardContainer
     * @param {Array} users
     */
    function _renderCardOnResize(mainTable, cardContainer, users) {
      mainTable
        .hide()
        .find("tbody")
        .empty();
      users.forEach(user => _appendCardData(cardContainer, user));
    }

    /**
     * HTML5 skeleton to draw a table row
     * @function _tableRowSkeleton
     * @private
     * @param {object} params
     * @return {String} html template
     */
    function _tableRowSkeleton({
      address,
      languages,
      skills,
      _id,
      name,
      username,
      email,
      phone,
      company,
      jobTitle,
      website,
      birthDate,
      experience,
      avatar,
      registeredDate
    }) {
      return `
   <tr scope="row" data-id=${_id}>
     <td class="user-avatar">
           <img class="img-fluid" src=${avatar} alt="${name}" /></td>
           <td class="fullname">
             <p>${name}</p>
           </td>
           <td class="user-email"><a href="mailto:${email}">${email}</a></td>
           <td class="user-city">
           <p> ${address.city}</p>
           </td>
           <td class="user-registered">${new Date(
             registeredDate
           ).toLocaleDateString()}</td>
           <td class="options text-center">
                  <button type="button" class=" my-2 btn btn-outline-success btn-sm detail"
                    data-id=${_id} data-toggle="modal" data-target="#userModal" title="View user">
                       <i class="far fa-eye"></i>
                  </button>
                  <button type="button" class="my-2 btn btn-outline-primary btn-sm edit" data-id=${_id} title="Edit user"><i class="fas fa-user-edit"></i></button>
                  <button type="button" class=" my-2 btn btn-outline-danger btn-sm delete" data-id=${_id} title="Delete user"><i class="far fa-trash-alt"></i></button>
            </td>
         </tr>
         `;
    }

    /**
     * HTML5 skeleton to draw a user card
     * @function _cardSkeleton
     * @private
     * @param {object} params
     * @return {String} html template
     */
    function _cardSkeleton(user) {
      let data = _renderLangsAndSkills(user);
      return `<div class="card mt-3 ml-5 shadow-lg p-3 mb-5 bg-white rounded" data-id=${
        user._id.value
      }>
      <div class=" d-flex card-header text-dark header-card shadow-sm  col-sm-12 border  rounded ">
      <div class="col-4">    <img class="img-fluid  mr-2" style="border-radius: 50%" src=${
        user.avatar
      } alt="test"/></div>
        <div class=" font-weight-bold col card-username">
           <p>${user.name}</p>
           <p>${user.username}</p>
        </div>
      </div>
     <div class="card-body">
     <div class=" font-weight-bold card-subtitle">Skills</div>
      <p class="card-text">
        ${data.skills.map(skillTag => skillTag).join("")}
      </p>
     <div class=" font-weight-bold card-subtitle">Languages</div>
       <p class="card-text">
       ${data.languages.map(langTag => langTag).join("")}
       </p>
     </div>
     <div class="card-footer text-right card-buttons">
        <button type="button" class="btn btn-outline-primary btn-sm" data-id=${
          user._id
        }><i class="fas fa-user-edit"></i></button>
        <button type="button" class="btn btn-outline-danger btn-sm delete" data-id=${
          user._id
        }><i class="far fa-trash-alt"></i></button>
     </div>
   </div>
  `;
    }

    /**
     * Get a user object by the properties email or ID
     * @function getUserByID
     * @public
     * @param {string} email || id
     * @return {object} User
     */
    function getUserByID(value) {
      return JSON.parse(sessionStorage.getItem("users-list")).find(
        user => user._id === value
      );
    }

    /**
     * Delete user permanently in the JSON data.
     * @function deleteUser
     * @public
     * @param {string} id
     */
    function deleteUser(id) {
      let users = JSON.parse(sessionStorage.getItem("users-list"));
      users = users.filter(user => user._id !== id);
      sessionStorage.setItem("users-list", JSON.stringify(users));
      _removeUserFromDOM(id);
    }

    /**
     * Delete the user from the DOM after delete it from the JSON.
     * @function _removeUserFromDOM
       @private
     * @param {string} id
     */
    function _removeUserFromDOM(_id) {
      const tableBody = mainContainer.find("#users-table tbody");
      if (tableBody.children("tr").length > 0) {
        tableBody.find(`tr[data-id=${_id}]`).remove();
      } else {
        mainContainer
          .find(`#card-container > .user-card[data-id=${_id}]`)
          .remove();
      }
    }

    function _showOverlay(show) {
      const mainTable = mainContainer.find("#users-table");
      const tableBody = mainTable.find("tbody");
      const cardContainer = mainContainer.find("div#card-container");

      let overlayContainer = tableBody.length > 0 ? tableBody : cardContainer;

      if (show) {
        overlayContainer
          .css("position", "relative")
          .append(`<div class="loading">Loading&#8230;</div>`);
      } else {
        overlayContainer
          .css("position", "static")
          .find("div.loading")
          .remove();
      }
    }

    /**
     * Render the user data when the modal is opened
     * @function renderDataOnModal
     * @public
     * @param {object} event
     */
    function renderDataOnModal(event) {
      const element = $(event.relatedTarget);
      const modal = $(this);
      const user = getUserByID(element.data("id"));

      const { avatar, username, name, birthDate, phone, address } = user;

      const modalBody = modal.find(".modal-body");

      modalBody.find("#infoUser span").remove();

      modal.find(".modal-title").text(name + " ~ " + username);
      modalBody.find("img").prop("src", avatar);

      _appendBirthday(modalBody, birthDate);
      _appendPhones(modalBody, { phone });
      _appendAddress(modalBody, address);
      _appendTechSkills(modalBody, user);
    }

    function _appendBirthday(container, birthDate) {
      container
        .find(".birthday")
        .append(`<span>${new Date(birthDate).toLocaleDateString()}</span>`);
    }

    function _appendPhones(container, phones) {
      container
        .find(".phones")
        .children("i")
        .each((index, element) => {
          if ($(element).hasClass("fa-mobile-alt")) {
            $(`<span>${phones.phone}</span>`).insertAfter($(element));
          }
        });
    }

    function _appendAddress(container, address) {
      container
        .find(".address")
        .append(
          `<span>${address.street} ~ ${address.city} / ${
            address.country
          }</span>`
        );
    }

    function _appendTechSkills(container, user) {
      ["skills", "languages"].map(key => {
        let data = _renderLangsAndSkills(user);

        if (key === "skills") {
          container
            .find(`#${key}Info > .card-body`)
            .empty()
            .append(`${data.skills.map(skillTag => skillTag).join("")}`);
        } else if (key === "languages") {
          container
            .find(`#${key}Info > .card-body`)
            .empty()
            .append(`${data.languages.map(langTag => langTag).join("")}`);
        }
      });
    }

    return {
      construct,
      initTable,
      getUserByID,
      renderDataOnResize,
      renderDataOnModal,
      deleteUser
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

const usersTable = Table.getInstance();
