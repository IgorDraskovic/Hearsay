console.log('...loaded');

// ~~~~~~~~~~~~~~~~~~~~ BEAHVIORS ~~~~~~~~~~~~~~~~~~~~ //
// 1. getAllUsers
// 2. getAllHearsays
// 3. createUser
// 4. createHearsay
// 5. createComment
// 6. renderUsers
// 7. humanTime
// 8. renderHearsay
// 9. renderHearsayList
// 10. renderCommentForm
// 11. renderComment
// 12. updateUser
// 13. updateUsersAndView
// 14. updateHearsaysAndViews
// 15. setUpdateUserFormHandler
// 16. setCreateUserFormHandler
// 17. setHearsayFormHandler
// 18. setCommentFormHandler
// 19. logInUser
// 20. setLogInFormHandler
// 21. setLogOutHandler
// ~~~~~~~~~~~~~~~~~~~~ Global Variables ~~~~~~~~~~~~~~~~~~~~ //
var hearsaysList;
var usersList;

// ~~~~~~~~~~~~~~~~~~~~ GET ALL ~~~~~~~~~~~~~~~~~~~~ //
// Get all Users
function getAllUsers(callback){
  callback = callback || function(){};
  $.ajax({
    url: '/api/users',
    success: function(data){
      var users = data.users || [];
      callback(users);
    }
  })
}

// Get all Hearsays
function getAllHearsays(callback){
  callback = callback || function(){};
  $.ajax({
    url: '/api/hearsays',
    success: function(data){
      var hearsays = data.hearsays || [];
      callback(hearsays);
      var source = $('#hearsays-template').html();
      var template = Handlebars.compile(source);
      var compiledHtml = template(data);
      $('#hearsay-list').empty();
      $('#hearsay-list').append(compiledHtml);
    }
  });
}

// ~~~~~~~~~~~~~~~~~~~~ CREATE ~~~~~~~~~~~~~~~~~~~~ //
// Send a request to create a User
function createUser(userData, callback) {
  $.ajax({
    method: 'post',
    url: 'api/users',
    data: {user: userData},
    success: function(data){
      callback(data)
    }
  });
}

// Send a request to create a Hearsay
function createHearsay(hearsayData, callback){
  callback = callback || function(){}
  $.ajax({
    method: 'post',
    data: {hearsay: hearsayData},
    url: '/api/hearsays',
    success: function(data){
      var hearsay = data.hearsay;
      callback(hearsay);
    }
  });
}

// Send a request to create a Comment
function createComment(hearsayID, commentBody, callback){
  callback = callback || function(){};
  $.ajax({
    url: '/api/hearsays/' + hearsayID + '/comments',
    method: 'post',
    data: {comment: commentBody},
    success: function(data){
      var comment = data.comment;
      callback(comment);
    }
  });
}

// ~~~~~~~~~~~~~~~~~~~~ RENDER ~~~~~~~~~~~~~~~~~~~~ //
// Render Users
function renderUsers(usersArray){
  var source = $('#users-template').html();
  var template = Handlebars.compile(source);
  var context = {users: usersArray};
  var usersElement = template(context);
  return usersElement;
}

// function humanTime(date){
//   date = date.split('');
//   var day = date.slice(8, 10).join('');
//   var month = date.slice(5, 7).join('');
//   var year = date.slice(0, 4).join('');
//   var hour = date.slice(11, 13).join('');
//   var minute = date.slice(14, 16).join('');

//   return month + '/' + day + '/' + year + ' ' + '|' + ' ' + (hour - 5) + ':' + minute;
// }

Handlebars.registerHelper('toHuman', function(date){
  date = date.split('');
  var day = date.slice(8, 10).join('');
  var month = date.slice(5, 7).join('');
  var year = date.slice(0, 4).join('');
  var hour = date.slice(11, 13).join('');
  var minute = date.slice(14, 16).join('');

  return (hour - 5) + ':' + minute + ' ' + 'on' + ' ' + month + '/' + day + '/' + year;
});


// ~~~~~~~~~~~~~~~~~~~~ UPDATE ~~~~~~~~~~~~~~~~~~~~ //
// Send request to update a User
function updateUser(userData, callback){
  $.ajax({
    method: 'patch',
    url: '/api/users',
    data: {user: userData},
    success: function(data){
      callback(data);
    }
  });
}

//Render Users And View
function updateUsersAndView(){
  getAllUsers(function(users){
    $('section#users').empty();
    var usersElement = renderUsers(users);
    $('section#users').append(usersElement);
  });

  if($.cookie('token')){
    $('.user-only').show();
  } else {
    $('.user-only').hide();
  }
}

// Update Hearsays and the view section for users
function updateHearsaysAndViews(){
  getAllHearsays(function(hearsays){
    console.log(hearsays);
    var hearsaysData = hearsays;
    var $list = $('#hearsay-list');
    renderHearsayList(hearsays, $list);
  });
}

// ~~~~~~~~~~~~~~~~~~~~ DELETE ~~~~~~~~~~~~~~~~~~~~ //
function removeHearsay(){
 $('body').on('click', '#delete-hearsay', function(e){
    e.preventDefault();
    var hearsay = $(this);
    var hearsayBody = hearsay.prev().text();
    console.log($.cookie('token'));
    getAllHearsays(function(hearsays){
      console.log(hearsays);
      for(var i = 0; i < hearsays.length; i ++){
        var hearsayIndex = hearsays[i];
        if(hearsayIndex.body === hearsayBody){
          var hearsayUser = hearsayIndex.username;
          getAllUsers(function(users){
            for(var i = 0; i < users.length; i++){
              var userIndex = users[i];
              if(hearsayUser === userIndex.username && userIndex.token === $.cookie('token')){
                $.ajax({
                   method: 'delete',
                   url: '/api/hearsays/' + hearsay.data('id'),
                   success: function(){
                    $(this).remove();
                    updateHearsaysAndViews();
                   }
                });
              } else {
                console.log('YOU ARE NOT OP');
              }
            }
          });
        } else {
          console.log('Somehow it does not exists');
        }
      }
    });
 });
}

// ~~~~~~~~~~~~~~~~~~~~ SET FORMS ~~~~~~~~~~~~~~~~~~~~ //
// Acquire input values from the form to update the user's password
function setUpdateUserFormHandler(){
  $('form#update-password').on('submit', function(e){
    e.preventDefault();

    var passwordField = $(this).find('input[name="password"]');
    var passwordText = passwordField.val();
    passwordField.val('');

    var userData = {password: passwordText};

    updateUser(userData, function(user){
      console.log(user);
      updateUsersAndView();
    });

  });
}

// Acquire input values from the create user form and create a user based on those values
function setCreateUserFormHandler(){
  $('form#sign-up').on('submit', function(e){
    e.preventDefault();

    // Obtain the first name from form
    var firstNameField = $(this).find('input[name="user[firstName]"]');
    var firstNameText = firstNameField.val();
    firstNameField.val('');

    // Obtain the last name from form
    var lastNameField = $(this).find('input[name="user[lastName]"]');
    var lastNameText = lastNameField.val();
    lastNameField.val('');

    // Obtain email from form
    var emailField = $(this).find('input[name="user[email]"]');
    var emailText = emailField.val();
    emailField.val('');

    // Obtain the username from form
    var usernameField = $(this).find('input[name="user[username]"]');
    var usernameText = usernameField.val();
    usernameField.val('');

    // Obtain the password from form
    var passwordField = $(this).find('input[name="user[password]"]');
    var passwordText = passwordField.val();
    passwordField.val('');

    // Obtain state and state from form
    var stateField = $(this).find('select[name="user[state]"]');
    var stateText = stateField.val();
    stateField.val('');

    // Obtain city and state from form
    var cityField = $(this).find('select[name="user[city]"]');
    var cityText = cityField.val();
    cityField.val('');

    // Organize the data to be sent
    var userData = {firstName: firstNameText, lastName: lastNameText, email: emailText, username: usernameText, password: passwordText, location: cityText + ", " + stateText};
    console.log('userdata', userData);

    // Create a new user
    createUser(userData, function(user){
    });
  });
}

// Acquire input data from the Hearsay form and create a hearsay using the acquired data
function setHearsayFormHandler(){
  $('form#hearsay-generator').on('submit', function(e){
    e.preventDefault();
    var formUsername = $(this).find('input[name="username"]').val(); //to be taken out later, testing purposes etc..
    var $formElement = $(this).find('textarea[name="body"]');
    var formBody = $formElement.val();
    var hearsayData = {body:formBody};
    createHearsay(hearsayData, function(hearsay){
      updateHearsaysAndViews();
    });
    $formElement.val('');
  });
}

// Acquire input data from the comment form and create a comment using the acquired data
function setCommentFormHandler(){
  $('body').on('submit', 'form#comment-generator', function(e){
    e.preventDefault();

    var hearsayID = $(this).find('input[name="hearsay-id"]').val();
    var formUsername = $(this).find('input[name="username"]').val(); //again to be taken out later, testing etc...
    var formBody = $(this).find('input[name="body"]').val();
    var commentData = {body:formBody};
    console.log(commentData);
    createComment(hearsayID, commentData, function(comment){
      updateHearsaysAndViews();
    });
  });
}

// ~~~~~~~~~~~~~~~~~~~~ LOGIN / LOGOUT ~~~~~~~~~~~~~~~~~~~~ //
// Send a request to LogIn
function logInUser(usernameAttempt, passwordAttempt, callback) {
  $.ajax({
    method: 'post',
    url: '/api/users/authenticate',
    data: {username: usernameAttempt, password: passwordAttempt},
    success: function(data){
      $.cookie('token', data.token);
      callback(data);
    }
  });
}

// Acquire input data from login form and see if it matches in the database. If it does, then give the user a cookie with a token
function setLogInFormHandler(){
  $('form#log-in').on('submit', function(e){
    e.preventDefault();

    var usernameField = $(this).find('input[name="username"]');
    var usernameAttempt = usernameField.val();
    usernameField.val('');

    var passwordField = $(this).find('input[name="password"]');
    var passwordAttempt = passwordField.val();
    passwordField.val('');

    var userData = {username: usernameAttempt, password: passwordAttempt};

    logInUser(usernameAttempt, passwordAttempt, function(data){

      $.cookie('token', data.token);
      $('#user-manager').hide();
      $('#hearsay-generator').show();
      console.log('Token:', $.cookie('token') );
      updateHearsaysAndViews();
      location.reload();
    });
  });
}

// Logout user form
function setLogOutHandler(){
  $('form#log-out').on('submit', function(e){
    e.preventDefault();
    $.removeCookie('token');
    updateHearsaysAndViews();
    location.reload();
  });
};



// ~~~~~~~~~~~~~~~~~~~~ DOCUMENT READY FUNCTION ~~~~~~~~~~~~~~~~~~~~ //


$(function(){

  if($.cookie('token')){
    $('#hearsay-generator').show();
    $('#users-template').show();
    $('form#log-out').show();
    $('input#search-field').show();
    $('form#log-in').hide();
    $('#user-manager').hide();
    setHearsayFormHandler();
    setCommentFormHandler();
    setLogOutHandler();
    updateHearsaysAndViews();
    removeHearsay();
  } else {
    $('.update-password').hide();
    $('form#log-in').show();
    $('button#log-out').hide();
    $('#hearsay-generator').hide();
    $('#users-template').hide();
    $('form#log-out').hide();
    $('input#search-field').hide();
    setCreateUserFormHandler();
    setLogInFormHandler();
  }

  // $('#delete-hearsay').click(function(){
  //   if (!confirm("Are you sure?")){
  //     return false;
  //   }
  // });

  $('input#search-field').on('keyup', function(){
    var searchText = $(this).val();
      $.ajax({
      url: '/api/hearsays?search=' + searchText,
      success: function(data){
        console.log(data);
        var hearsays = data.hearsays;
        var $list = $('#hearsay-list');
        renderHearsayList(hearsays, $list);
      }
    });
  });


});
