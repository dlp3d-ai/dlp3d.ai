import React, { ReactElement } from 'react'
import useBabylonJS from '../hooks/useBabylonJS'

function Scene(): ReactElement {
  const { canvas: canvas } = useBabylonJS()

  return (
    <canvas
      ref={canvas}
      style={{
        width: '100%',
        gridRow: 1,
        gridColumn: 1,
      }}
      id="canvas"
    />
  )
}

export default Scene
