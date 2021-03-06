define([
    'js/sharedConfig', 'js/widget', 'js/card/card', 'js/card/cardProperty',
    'js/card/cardWidget', 'js/card/cardDashboard'
], function (SharedConfig, Widget, Card, CardProperty, CardWidget, CardDashboard) {
    return {
        SharedConfig: SharedConfig,
        Widget: Widget,
        Card: Card,
        CardProperty: CardProperty,
        CardWidget: CardWidget,
        CardDashboard: CardDashboard
    }
});