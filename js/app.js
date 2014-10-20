var app = angular.module('contentServerWorkflow', ['ngCookies']);

app.service('otagService', function () {
    return {

    }
});

app.directive('csFileUpload', function (otagService, $timeout) {
    return {
        restrict: 'A',
        link: function (scope, element, attrs) {

            var input = angular.element('<input type="file">'),
                stateIndicator = element.find('img'),
                stateIndicatorOriginalState = stateIndicator.attr('src');

            /**
             * define the actions that take place when this directive is clicked. this involves the following:
             *  - open the input for the user to select a file.
             *  - select file and pass it to otagService to upload to ContentServer
             *  - provide feedback while process is handled by showing a loading indicator
             *  - remove the loading indicator on success, or error
             *  - if error, explain why the error occured.
             */
            element.bind('click', function () {
                input[0].click();
            });

            input.on('change', function (e) {
                var file = e.target.files[0];
                input.val('');
                stateIndicator.attr('src', 'img/spinner.gif');

                // TODO upload the file to content server and remove the spinner.
                $timeout(function () {
                    var textHelper = angular.element('<h3 class="text-success">Workflow started successfully</h3>');
                    element.append(textHelper)
                    $timeout(function () {
                        stateIndicator.attr('src', stateIndicatorOriginalState);
                        textHelper.remove();
                    }, 1000);

                }, 2000);
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
