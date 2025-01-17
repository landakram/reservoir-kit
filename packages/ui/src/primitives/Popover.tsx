import React from 'react'
import * as Popover from '@radix-ui/react-popover'
import { styled } from '../../stitches.config'
import Box from './Box'

const Arrow = styled(Popover.Arrow, {
  width: 15,
  height: 7,
  fill: '$popoverBackground',
})

const Content = styled(Popover.Content, {
  filter: 'drop-shadow(0px 2px 16px rgba(0, 0, 0, 0.75))',
  zIndex: 1000,
})

const RKPopover = ({
  children,
  content,
  side = 'bottom',
  width = '100%',
}: any) => {
  return (
    <Popover.Root>
      <Popover.Trigger>{children}</Popover.Trigger>
      <Content side={side}>
        <Arrow />
        <Box
          css={{
            p: '$3',
            maxWidth: 320,
            width: width,
            borderRadius: 8,
            backgroundColor: '$popoverBackground',
          }}
        >
          {content}
        </Box>
      </Content>
    </Popover.Root>
  )
}

export default RKPopover
