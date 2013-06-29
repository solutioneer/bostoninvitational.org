
/**
 * @file
 * Javascript functions for getdirections module admin
 *
 * @author Bob Hutchinson http://drupal.org/user/52366
 * jquery stuff
*/
(function ($) {
  Drupal.behaviors.getdirections_admin = {
    attach: function() {
      // admin form
      if ($("#edit-getdirections-default-use-advanced").attr('checked')) {
        $("#wrap-waypoints").show();
      }
      else {
        $("#wrap-waypoints").hide();
      }
      $("#edit-getdirections-default-use-advanced").change(function() {
        if ($("#edit-getdirections-default-use-advanced").attr('checked')) {
          $("#wrap-waypoints").show();
        }
        else {
          $("#wrap-waypoints").hide();
        }
      });

      if ($("#edit-getdirections-returnlink-page-enable").attr('checked')) {
        $("#wrap-page-link").show();
      }
      else {
        $("#wrap-page-link").hide();
      }
      $("#edit-getdirections-returnlink-page-enable").change(function() {
        if ($("#edit-getdirections-returnlink-page-enable").attr('checked')) {
          $("#wrap-page-link").show();
        }
        else {
          $("#wrap-page-link").hide();
        }
      });

      if ($("#edit-getdirections-returnlink-user-enable").attr('checked')) {
        $("#wrap-user-link").show();
      }
      else {
        $("#wrap-user-link").hide();
      }
      $("#edit-getdirections-returnlink-user-enable").change(function() {
        if ($("#edit-getdirections-returnlink-user-enable").attr('checked')) {
          $("#wrap-user-link").show();
        }
        else {
          $("#wrap-user-link").hide();
        }
      });

      if ($("#edit-getdirections-returnlink-term-enable").attr('checked')) {
        $("#wrap-term-link").show();
      }
      else {
        $("#wrap-term-link").hide();
      }
      $("#edit-getdirections-returnlink-term-enable").change(function() {
        if ($("#edit-getdirections-returnlink-term-enable").attr('checked')) {
          $("#wrap-term-link").show();
        }
        else {
          $("#wrap-term-link").hide();
        }
      });

      if ($("#edit-getdirections-returnlink-comment-enable").attr('checked')) {
        $("#wrap-comment-link").show();
      }
      else {
        $("#wrap-comment-link").hide();
      }
      $("#edit-getdirections-returnlink-comment-enable").change(function() {
        if ($("#edit-getdirections-returnlink-comment-enable").attr('checked')) {
          $("#wrap-comment-link").show();
        }
        else {
          $("#wrap-comment-link").hide();
        }
      });

      if ($("#edit-getdirections-colorbox-enable").attr('checked')) {
        $("#wrap-getdirections-colorbox").show();
      }
      else {
        $("#wrap-getdirections-colorbox").hide();
      }
      $("#edit-getdirections-colorbox-enable").change(function() {
        if ($("#edit-getdirections-colorbox-enable").attr('checked')) {
          $("#wrap-getdirections-colorbox").show();
        }
        else {
          $("#wrap-getdirections-colorbox").hide();
        }
      });
    }
  }
  })(jQuery);
