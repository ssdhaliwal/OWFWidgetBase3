# OWFWidgetBase
## Base widget example on how to use JQuery/Handlebars/Luxon/Lodash/Notify etc
## 12Jan/18 - added es-shims for es5/6 for compatibility with some older browsers
## 3Mar/18 - fixed the OWF.ready error from incorrect instantiation

#### It uses Handlebars to create four components Card, CardDashboard, CardProperty, and CardWidget; to display details of the user properties.

#### RequireJS - (removed Dojo due to problems with libraries) - especially Alpaca for forms.
##### List of libraries which are tested
##### Material Icons, FontAwesone
##### es6-shim.min.js, fontawesome-all.min.js, owf-widget.min.js, jquery-3.2.1.min.js, handlebars-4.0.11.min.js, underscore-1.8.3.min.js, lodash-4.17.4.min.js, bootstrap-3.3.7.min.js, moment-with-locales.min.js, alpaca.min.js, backbone.min.js, date.format-1.2.3.js, bootstrap/collapse.js, bootstrap/transition.js, bootstrap-multiselect.js, bootstrap-notify.min.js, bootstrap-tokenfield.min.js, bootstrap-datetimepicker.min.js, bloodhound.min.js, typeahead.bundle.min.js, jquery.smartmenus.js, jquery.smartmenus.bootstrap.js, jquery-ui.js, jquery.maskedinput.min.js, jquery.price_format.min.js, jquery.spectrum.colorpicker.js, ckeditor/ckeditor.js, semantic.min.js, datatables.min.js

#### Custom events are linked to each card type - for demo: (a) OWF, User, UUID, and Summary properties use base Card, (b) Group properties use CardProperty, (c) Widget properties use CardWidget, and (d) Dashboard properties use CardDashboard to render content.  Each card has its click event linked.
15Jan/2018 - updated to move all events to each component; this reduces the overhead and duplication.

#### All external dependencies are stored in "vendor" folder.
---
#### Screen captures:

![alt text][capture1]

[capture1]: https://github.com/ssdhaliwal/OWFWidgetBase3/blob/master/images/OWFWidgetBase3-1.PNG "Capture 1"

[<img src="https://github.com/ssdhaliwal/OWFWidgetBase3/blob/master/images/OWFWidgetBase3-2.PNG" alt="Capture 2" width="100px">
<img src="https://github.com/ssdhaliwal/OWFWidgetBase3/blob/master/images/OWFWidgetBase3-3.PNG" alt="Capture 3" width="100px">
<img src="https://github.com/ssdhaliwal/OWFWidgetBase3/blob/master/images/OWFWidgetBase3-4.PNG" alt="Capture 4" width="100px">
<img src="https://github.com/ssdhaliwal/OWFWidgetBase3/blob/master/images/OWFWidgetBase3-5.PNG" alt="Capture 5" width="100px">]
<img src="https://github.com/ssdhaliwal/OWFWidgetBase3/blob/master/images/OWFWidgetBase3-6.PNG" alt="Capture 6" width="100px">]

---
```
Directory Structure
(root)
|- descriptro
|- vendor
|- widget
|  |- css
|     |- base_style.css
|     |- widget_style.css
|  |- images
|     |- event_note_24px.svg
|     |- event_note_48px.svg
|     |- loading_blue.gif
|  |- js
|     |- card
|        |- card.css
|        |- card.html
|        |- card.js
|        |- cardDashboard.css
|        |- cardDashboard.html
|        |- cardDashboard.js
|        |- cardDashProperty.css
|        |- cardDashProperty.html
|        |- cardDashProperty.js
|        |- cardDashWidget.css
|        |- cardDashWidget.html
|        |- cardDashWidget.js
|     | widgetConfig.js
|     | widget.js
| app.js
| index.html
| server.js
```
---
 License: MIT
