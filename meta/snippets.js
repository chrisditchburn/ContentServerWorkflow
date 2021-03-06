var app = angular.module('ContentServerWebReports', ['ngCookies']);

app.run(function ($cookies, $http, $rootScope, $window) {

    /** bind the url of the gateway to the $rootScope object */
    $rootScope._otagUrl = ($window.otag && $window.otag.serverURL) || '';

    /** configure the $http object to include the otag token and otds ticket in headers of all outgoing requests */
    if ($window.otag && $window.otag.auth) {
        $http.defaults.headers.common.otagtoken = $window.otag.auth.otagtoken;
    }
    else if ($cookies.otagtoken) {
        $http.defaults.headers.common.otagtoken = $cookies.otagtoken;
    }

});

app.service('contentServerService', function ($http, $rootScope) {
    var self = this;

    /** details required to form the request to send to our static content server directory */
    self.node = {
        parent_id: 3430,
        type: 144,
        description: 'Initiating a webreport from the mobile client (appworks)'
    };

    /**
     * generate a hashcode from the current time. used to force file names to be unique, since photos are all named
     * image.jpg when added from ios devices.
     * @returns {string}
     */
    var dateSnapshotToHashCode = function () {
        var date = new Date().toString(), hash = 0, i, chr, len;
        if (date.length === 0) return hash;
        for (i = 0, len = date.length; i < len; i++) {
            chr   = date.charCodeAt(i);
            hash  = ((hash << 5) - hash) + chr;
            hash |= 0;
        }
        return Math.abs(hash).toString();
    };
    /**
     * private method that takes in a file object and creates the form parameters necessary to
     * upload this file to content server
     */
    var makeFormFromFile = function (file) {
        var formData = new FormData();
        formData.append('name', dateSnapshotToHashCode() + '-' + file.name);
        formData.append('parent_id', self.node.parent_id);
        formData.append('type', self.node.type);
        formData.append('description', self.node.description);
        formData.append('file', file);
        return formData;
    };

    return {
        uploadFileAndTriggerWebReport: function (file) {
            var form = makeFormFromFile(file);
            return $http.post($rootScope._otagUrl + '/contentserver/api/v1/nodes', form, {
                transformRequest: angular.identity,
                headers: {'Content-Type': undefined}
            });
        }
    };
});

app.directive('csFileUpload', function (contentServerService, $timeout) {
    return {
        restrict: 'A',
        link: function (scope, element) {

            var input = angular.element('<input type="file">'),
                icon = element.find('img'),
                iconSrc = icon.attr('src');
            /**
             * define the actions that take place when this directive is clicked. this involves the following:
             *  - open the input for the user to select a file.
             *  - select file and pass it to contentServerService to upload to ContentServer
             *  - provide feedback while process is handled by showing a loading indicator
             *  - remove the loading indicator on success, or error
             *  - if error, explain why the error occurred.
             */
            element.bind('click', function () {
                input[0].click();
            });

            input.on('change', function (e) {
                var file = e.target.files[0],
                    textHelper = angular.element('<h3 class="text-success">Web Report started successfully</h3>');

                var resetText = function () {
                    icon.attr('src', iconSrc);
                    textHelper.remove();
                };

                icon.attr('src', 'img/spinner.gif');

                contentServerService.uploadFileAndTriggerWebReport(file).success(function (data) {
                    element.append(textHelper);
                    $timeout(resetText, 3000);
                    input.val('');
                }).error(function (err) {
                    textHelper.text('Something went wrong: ' + err);
                    textHelper.css('color', 'maroon');
                    element.append(textHelper);
                    $timeout(resetText, 3000);
                    input.val('');
                });
            });

            /** styling for the element provides feedback on user touch */
            element.bind('touchstart', function () {
                element.css('background-color', '#BFBFBF');
            });
            element.bind('touchend', function () {
                element.css('background-color', 'transparent');
            });
        }
    }
});

// THE HTML VIEW
'<div cs-file-upload>
    <img src="img/camera.png" width="100"></img>
    <p class="text-muted">Tap to upload a photo to Content Server and trigger a workflow.</p>
</div>'

// THE REVERSE PROXY SETTINGS
'THE REVERSE PROXY
- allowed path patterns: contentserver/api/*
- proxy mappings: contentserver=tprodapp01.emss.opentext.com/otcs/cs.exe

- Content server Details
	- 	username: Admin
	-	password: cnQgcdL33b
	- 	public dns: https://tprodapp01.emss.opentext.com/otcs/cs.exe

- OTAG details
	- username: Test1
	- password: cnQgcdL33b!
	- public dns: https://tprodapp01.emss.opentext.com:8443/gateway 

- VM details
	- 	administrator account for computer:
		- 	id: tchadmin
		- 	password: TCHontheCFE1!
		-  	public ip: 142.75.251.168
		- 	internal ip: 10.13.7.168'
