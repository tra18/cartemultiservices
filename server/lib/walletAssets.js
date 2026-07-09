/** PNG minimal requis par Apple PassKit (icône + logo) */
const ICON_PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAB0AAAAdCAYAAABXkP5VAAAACXBIWXMAAAsTAAALEwEAmpwYAAAA' +
  'GXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyJpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAA' +
  'ADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1l' +
  'dGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuNi1jMTQyIDc5' +
  'LjU2MDM5OCwgMjAyMS8xMi8wOS0wMzoxNDoyMSAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRw' +
  'Oi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6' +
  'YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0i' +
  'aHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5j' +
  'b20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9w' +
  'IENDIDIwMjEgKFdpbmRvd3MpIiB4bXBNTTpJbnN0YW5jZUlEPSJ4bXAuaWlkOjY5RjY5RjY5RjY5RjY5RjY5' +
  'IiB4bXBNTTpEb2N1bWVudElEPSJ4bXAuZGlkOjY5RjY5RjY5RjY5RjY5RjY5Ij4gPHhtcE1NOkRlcml2ZWRG' +
  'cm9tIHN0UmVmOmluc3RhbmNlSUQ9InhtcC5paWQ6NjlGNjlGNjlGNjlGNjlGNjkiIHN0UmVmOmRvY3VtZW50' +
  'SUQ9InhtcC5kaWQ6NjlGNjlGNjlGNjlGNjlGNjkiLz4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4g' +
  'PC94OnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIiPz7/2Q=='

export function getPassIconBuffers() {
  const icon = Buffer.from(ICON_PNG_BASE64, 'base64')
  return {
    'icon.png': icon,
    'icon@2x.png': icon,
    'icon@3x.png': icon,
    'logo.png': icon,
    'logo@2x.png': icon,
    'logo@3x.png': icon,
  }
}
