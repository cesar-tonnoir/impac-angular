module = angular.module('impac.components.common.presentation',[])

module.directive('commonPresentation', ($templateCache, ImpacTheming) ->
  return {
    restrict: 'A',
    scope: {
      widgets: '='
      widgetIndex: '=?'
    },
    template: $templateCache.get('common/presentation.tmpl.html'),

    link: (scope, element) ->
      element.addClass('common-presentation')
      scope.enabled = false
      scope.widgetIndex ||= 0

      scope.toggle = ->
        scope.enabled = !scope.enabled
  }
)
