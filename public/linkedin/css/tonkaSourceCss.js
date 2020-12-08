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

.table {
    width: 100%;
    display: table;
}

.table-caption {
    display: table-caption;
    text-align: center;
    font-size: 30px;
    font-weight: bold;
}

.table-header{
    display: table-header-group;
    background-color: #015183;
    font-weight: bold;
    font-size: 20px;
    color: #FFF;
}

.table-header-cell{
    display: table-cell;
    padding: 10px;
    text-align: justify;
    border-bottom: 1px solid black;
}

.table-body {
    display: table-row-group;
}

.table-row {
    display: table-row;
}

.table-cell {
    display: table-cell;
    padding: 3px 10px;
}

.table-footer {
    display: table-footer-group;
    background-color: gray;
    font-weight: bold;
    font-size: 25px;
    color: rgba(255, 255, 255, 0.45);
}

.table-footer-cell {
    display: table-cell;
    padding: 10px;
    text-align: justify;
    border-bottom: 1px solid black;
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

.ts-content {
    display: none;
    width: 95%;
    height: 500px;
    overflow-y: auto;
    overflow-x: hidden;
    padding: 0 50px;
}

.ts-menu {
    font-size: 14px;
    font-weight: bold;
    width: 100%;
    margin: auto;
    text-align: center;
}

.ts-menu-item {
    width: 15%;
    display: inline-block;
    padding: 10px 10px;
    border-right: 1px solid #015183;
    text-align: center;
}

.ts-menu-item:first-of-type {
    border-left: 1px solid #015183;
}

.ts-menu-item:hover {
    background-color: #015183;
    color: white;
}

.ts-menu-button-toggle {
    float: right;
}

.ts-button-li, .ts-button-li:visited {
    font-weight: bold;
    border-width: 1px;
    border-style: solid;
    cursor: pointer;
    margin: 4px 10px 4px 0px;
    overflow: visible;
    text-decoration: none !important;
    text-align: center;
    width: auto;
    text-shadow: 0 1px 1px rgba(0,0,0,0.35);
    -webkit-border-radius: 3px;
    -moz-border-radius: 3px;
    -ms-border-radius: 3px;
    -o-border-radius: 3px;
    border-radius: 3px;
    padding: 0 10px;
    height: 26px;
    line-height: 24px;
    -webkit-box-sizing: border-box;
    -moz-box-sizing: border-box;
    box-sizing: border-box;
    font-size: 12px;
    color: #fff;
    background-color: #287bbc;
    border-color: #1b5480;
    filter: progid:DXImageTransform.Microsoft.gradient(gradientType=0, startColorstr='#FF287BBC', endColorstr='#FF23639A');
    background-image: -webkit-linear-gradient(top, #287bbc 0%,#23639a 100%);
    background-image: -moz-linear-gradient(top, #287bbc 0%,#23639a 100%);
    background-image: -o-linear-gradient(top, #287bbc 0%,#23639a 100%);
    background-image: linear-gradient(top, #287bbc 0%,#23639a 100%);
    white-space: nowrap;
    display: -moz-inline-stack;
    display: inline-block;
    vertical-align: middle;
    *vertical-align: auto;
    zoom: 1;
    *display: inline;
    vertical-align: middle;
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