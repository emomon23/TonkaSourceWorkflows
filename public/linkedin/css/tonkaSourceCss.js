(() => {
     // ADD CSS
    const css = `
.profile-grade-container {
    width: 100%;
    margin: 0 auto;
    text-align: center;
    line-height: 13px;
    padding: 3px;
}

.grade-container {
    border: .5px solid;
    font-size: 15px;
    font-weight: bold;
    padding: 1px;
    margin: 0px 3px;
    display: inline-block;
    text-align: center;
}

.grade {
    padding: 0px 7px 0px 7px;
    display: inline-block;
    font-size: 20px;
}

.grade-label {
    font-size: 7px;
}

.blue {
    color: blue;
}

.green {
    color: green;
}

.red {
    color: red;
}

.tooltip {
    position: relative;
    display: inline-block;
    border-bottom: 1px dotted black;
}

.tooltip .tooltiptext {
    visibility: hidden;
    width: 250px;
    background-color: black;
    color: #fff;
    text-align: left;
    border-radius: 6px;
    padding: 5px;
    position: absolute;
    z-index: 1;
    top: -5px;
    left: 110%;
}

.tooltip .tooltiptext::after {
    content: "";
    position: absolute;
    top: 50%;
    right: 100%;
    margin-top: -5px;
    border-width: 5px;
    border-style: solid;
    border-color: transparent black transparent transparent;
}

.tooltip:hover .tooltiptext {
    visibility: visible;
}

.popup {
    position: relative;
    display: none;
    cursor: pointer;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
  }

  /* The actual popup */
  .popup .popupContent {
    visibility: hidden;
    width: 160px;
    background-color: #555;
    color: 'white';
    text-align: center;
    border-radius: 6px;
    padding: 8px 0;
    position: absolute;
    z-index: 1;
    bottom: 125%;
    left: 50%;
    margin-left: -80px;
  }

  /* Popup arrow */
  .popup .popupContent::after {
    content: "";
    position: absolute;
    top: 100%;
    left: 50%;
    margin-left: -5px;
    border-width: 5px;
    border-style: solid;
    border-color: #555 transparent transparent transparent;
  }

  /* Toggle this class - hide and show the popup */
  .popup .show {
    visibility: visible;
    -webkit-animation: fadeIn .5s;
    animation: fadeIn .5s;
  }

  /* Add animation (fade in the popup) */
  @-webkit-keyframes fadeIn {
    from {opacity: 0;}
    to {opacity: 1;}
  }

  @keyframes fadeIn {
    from {opacity: 0;}
    to {opacity:1 ;}
  }
`;

    var newNode = document.createElement('style');
    newNode.textContent = css;
    var target = $('head')[0] || $('body')[0];
    $(target).append(newNode);
})();