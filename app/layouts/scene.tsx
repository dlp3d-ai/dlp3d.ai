'use client'
import React from 'react'
import styled from '@emotion/styled'
import Scene from '@/components/Scene'

const Root = styled.div`
  display: flex;
  flex-direction: column;
  height: 100dvh;
  min-height: 0;
`

const SceneContainer = styled.div`
  flex: 100%;
  display: flex;
  overflow: hidden; // To ensure the Babylon scene does not overflow
  min-height: 0;
`

const TopContainer = styled.div`
  display: flex;
  flex-direction: row;
  flex: 1;
  min-height: 0;
`

function SceneLayout() {
  return (
    <Root>
      <TopContainer>
        <SceneContainer>
          <Scene />
        </SceneContainer>
      </TopContainer>
    </Root>
  )
}

export default SceneLayout
