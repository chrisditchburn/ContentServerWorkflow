var app = angular.module('ContentServerWorkflow', ['ngCookies']);

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

    /** get the otcs ticket by providing credentials to the content server */
    $http({
        method:'POST',
        url: $rootScope._otagUrl +  '/contentserver/api/v1/auth',
        headers: {'Content-Type': 'application/x-www-form-urlencoded'},
        data: $.param({username: 'jibrahim', password: '********'})
    }).success(function (res) {
        $http.defaults.headers.common.otcsticket = res.ticket;
    });
});

app.service('contentServerService', function ($http, $rootScope, $q) {
    var self = this;
    /** set this to the id of the folder that contains the images to trigger the workflow */
    self.uploadNodeId = 12229;
    self.uploadFileType = 144;
    self.uploadFileDescription = 'Initiating a workflow from the mobile client (appworks)';

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
        formData.append('parent_id', self.uploadNodeId);
        formData.append('file', file);
        formData.append('type', self.uploadFileType);
        formData.append('description', self.uploadFileDescription);
        return formData;
    };

    return {
        uploadFileAndInitiateWorkflow: function (file) {
            var form = makeFormFromFile(file);
            return $http.post($rootScope._otagUrl + '/contentserver/api/v1/nodes', form, {
                transformRequest: angular.identity,
                headers: {'Content-Type': undefined }
            });
        }
    }
});

app.directive('csFileUpload', function (contentServerService, $timeout) {
    return {
        restrict: 'A',
        link: function (scope, element) {

            var input = angular.element('<input type="file">'),
                stateIndicator = element.find('img'),
                stateIndicatorOriginalState = stateIndicator.attr('src');

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
                    textHelper = angular.element('<h3 class="text-success">Workflow started successfully</h3>');

                var resetText = function () {
                    stateIndicator.attr('src', stateIndicatorOriginalState);
                    textHelper.remove();
                };

                stateIndicator.attr('src', 'img/spinner.gif');

                contentServerService.uploadFileAndInitiateWorkflow(file).success(function (data) {
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
                element.css('background-color', '#9f9f9f');
            });
            element.bind('touchend', function () {
                element.css('background-color', 'transparent');
            });
        }
    }
});
