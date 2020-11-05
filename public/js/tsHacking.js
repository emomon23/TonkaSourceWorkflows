(() => {
    window.fireEvent = (element, theEventName) => {
        const eventName = `${theEventName}_evt`;
        let event = window[eventName];

        if (!event) {
            event = jQuery.Event(theEventName);

            if (theEventName.indexOf('key') === 0){
               event.which = 65;
               event.code = 65;
               event.keyCode = 65
            }
          window[eventName] = event;
       }

       $(element).trigger(event);
    }

    window.fireMouseSeries = (element) => {
        fireEvent(element, 'mouseenter');
        fireEvent(element, 'mouseover');
        fireEvent(element, 'mousemove')
        fireEvent(element, 'mousedown');
        fireEvent(element, 'mouseup');
        fireEvent(element, 'click');
    };

    window.fireKeyPressSeries = (element) => {
       window.fireEvent(element, 'keydown');
       window.fireEvent(element, 'keypress');
       window.fireEvent(element, 'textInput');
       window.fireEvent(element, 'input');
       window.fireEvent(element, 'keyup');
    }

    window.observeDOM = (function (){
        var MutationObserver = window.MutationObserver || window.WebKitMutationObserver;

        return function ( obj, callback ){
            if( !obj || obj.nodeType !== 1 ) return; // validation

            if( MutationObserver ){
                // define a new observer
                var obs = new MutationObserver((mutations, observer) => {
                    callback(mutations);
                })
                // have the observer observe foo for changes in children
                obs.observe( obj, { childList:true, subtree:true });
            }

            else if( window.addEventListener ){
                obj.addEventListener('DOMNodeInserted', callback, false);
                obj.addEventListener('DOMNodeRemoved', callback, false);
            }
        }
    })();

    window.setupHackMonitors = (jQuerySelector) => {
         $(jQuerySelector).on("click focus blur focusin keydown change click dblclick keydown keyup keypress input textInput touchstart touchmove touchend touchcancel resize scroll select change submit reset",(e) => {
            tsCommon.log({element: 'body', e});
         });
    }
})();