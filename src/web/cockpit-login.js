/*
 * This file is part of Cockpit.
 *
 * Copyright (C) 2013 Red Hat, Inc.
 *
 * Cockpit is free software; you can redistribute it and/or modify it
 * under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation; either version 2.1 of the License, or
 * (at your option) any later version.
 *
 * Cockpit is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
 * Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with Cockpit; If not, see <http://www.gnu.org/licenses/>.
 */

function cockpit_login_update ()
{
    var ok = ($('#login-user-input').val() &&
              $('#login-password-input').val());
    $('#login-button').button(ok? 'enable' : 'disable');
}

function cockpit_login_init ()
{
    // Note: we don't yet have a D-Bus connection so use the cockpitdyn.js mechanism
    // to obtain the hostname to display
    var display_hostname;
    display_hostname = cockpitdyn_pretty_hostname;
    if (!display_hostname)
        display_hostname = cockpitdyn_hostname;
    $("#login-display-name").text(display_hostname);
    if (cockpitdyn_avatar_data_url)
        $("#login-avatar").attr('src', cockpitdyn_avatar_data_url);

    function login ()
    {
        $('#login-error-message').text("");
        $('#login-form').toggleClass('has-error', false);

        var req = new XMLHttpRequest();
        var loc = window.location.protocol + "//" + window.location.host + "/login";
        var timeout_id;
        req.open("POST", loc, true);
        req.onreadystatechange = function (event) {
	    if (req.readyState == 4) {
                clearTimeout(timeout_id);
                if (req.status == 200) {
                    cockpit_connection_config = JSON.parse(req.responseText);
                    cockpit_init_connect_local();
                } else {
                    $("#login-error-message").text(_("Sorry, that didn't work.") + " (" + req.status + ")");
                    $('#login-form').toggleClass('has-error', true);
                    $("#login-password-input").focus();
                }
	    }
            phantom_checkpoint();
        };
        req.send($("#login-user-input").val() + "\n" + $("#login-password-input").val());
        timeout_id = setTimeout(function () {
            req.abort();
        }, 10000);
    }

    $("#login-user-input").on("keyup change", cockpit_login_update);
    $("#login-user-input").on("keydown", function (e) {
            if (e.which == 13)
                $("#login-password-input").focus();
    });
    $("#login-password-input").on("keyup change", cockpit_login_update);
    $("#login-password-input").on("keydown", function (e) {
            if (e.which == 13)
                login ();
    });
    $('#login-button').on('click', login);

    cockpit_login_refresh ();
}

function cockpit_login_show ()
{
    $("#login-password-input").val("");
    cockpit_login_update ();

    $('.page').hide();
    $('#login').show();

    $("#login-user-input").focus();
}

function cockpit_login_refresh ()
{
    $("#login-user-input")[0].placeholder = C_("login-screen", "Enter user name");
    $("#login-password-input")[0].placeholder = C_("login-screen", "Enter password");
}

function cockpit_logout (reason)
{
    if (reason) {
        $("#login-error-message").text(reason);
        $('#login-form').toggleClass('has-error', true);
    }

    var req = new XMLHttpRequest();
    var loc = window.location.protocol + "//" + window.location.host + "/logout";
    req.open("POST", loc, true);
    req.onreadystatechange = function (event) {
	if (req.readyState == 4) {
            cockpit_hide_disconnected();
            cockpit_disconnect();
            cockpit_login_show();
        }
    };
    req.send();
}

function cockpit_go_login_account ()
{
    cockpit_go ([ { page: "dashboard" },
                  { page: "server", machine: "localhost" },
                  { page: "accounts" },
                  { page: "account", id: cockpit_connection_config.user }
                ]);
}
