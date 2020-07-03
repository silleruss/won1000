(function () {
    
});

function svgDrawingFreeShape(svg_node) {
    
}

function svgDrawCircle(svg_node, points, dotDataSet) {
    
}

function testDrawLine(svg_node) {

}


// click pin draw event

    
function displayPinIcon(point, item) {
    let href = '/sitemaps/edit-pin/' + 'siteId';
    if (item) {
        href += '/' + item;
    }

    let link = document.createElement('a');
    link.href = '#';
    link.dataset.href = href;
    link.id = 'pin-' + item;
    link.className = 'fas fa-map-marker';
    link.style.cssText =
            ' text-decoration: none; font-size: 22px; color: red;' +
            ' cursor: pointer';

    viewer.addOverlay({
        element: link,
        location: point,
        placement: 'TOP',
        checkResize: false
    });

    new OpenSeadragon.MouseTracker({
        element: link,
        clickHandler: function () {
            const href = this.element.getAttribute("data-href");
            const webPointX = this.element.offsetWidth / 2 + this.element.offsetLeft;
            const webPointY = this.element.offsetHeight / 2 + this.element.offsetTop;
            const viewportPoint = viewer.viewport.pointFromPixel(new OpenSeadragon.Point(webPointX, webPointY));
            displayPinOverlay(href, webPointX, webPointY, viewportPoint);
        },
        dragHandler: function (event) {
            let windowCoords = new OpenSeadragon.Point(event.originalEvent.x, event.originalEvent.y);
            let viewportCoords = viewer.viewport.windowToViewportCoordinates(windowCoords);
            let overlay = viewer.getOverlayById(this.element);
            overlay.update(viewportCoords, OpenSeadragon.Placement.BOTTOM);
            overlay.drawHTML(this.element.parentNode, viewer.viewport);
        },
    });
}

function displayPinOverlay(href, webPointX, webPointY, viewportPoint) {
    
}


// button push on toolbar
function addCustomButton(viewer, customButton) {
    console.log(viewer);
    viewer.buttons.buttons.push(customButton);
    viewer.buttons.element.appendChild(customButton.element);
}

// button click event
// function customButtonClicked(viewer, svg_node) {
//     console.log(viewer);
//     // d3.select(svg_node).append("line")
//     //     .attr("")

//     let mouseTracker = new OpenSeadragon.MouseTracker({
//         element: viewer.container,
//         dragHandler: function (event) {
//             console.log(event);
//         },
//         enterHandler: function (event) {
//             console.log(event);
//         }
//     });
// }

