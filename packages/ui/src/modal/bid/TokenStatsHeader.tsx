import { useTokens, useCollections } from '../../hooks'
import React, { FC } from 'react'
import { styled } from '../../../stitches.config'
import { Box, Text } from '../../primitives'
import optimizeImage from '../../lib/optimizeImage'

const Img = styled('img', {
  width: '100%',
  '@bp1': {
    height: 100,
    width: 100,
  },
  borderRadius: '$borderRadius',
})

type Props = {
  token?: NonNullable<NonNullable<ReturnType<typeof useTokens>>['data']>['0']
  collection: NonNullable<ReturnType<typeof useCollections>['data']>[0]
}

const TokenStatsHeader: FC<Props> = ({ token, collection }) => {
  const img = optimizeImage(
    token?.token?.image ? token.token.image : (collection?.image as string),
    600
  )

  return (
    <Box
      css={{
        mr: '$4',
        width: 120,
        '@bp1': {
          mr: 0,
          width: '100%',
        },
      }}
    >
      <Text
        style="subtitle2"
        color="subtle"
        css={{ mb: '$1', display: 'block' }}
      >
        {token ? 'Item' : 'Collection'}
      </Text>
      <Img
        src={img}
        css={{
          mb: '$2',
          visibility: !img || img.length === 0 ? 'hidden' : 'visible',
          objectFit: 'cover',
        }}
      />
      <Text style="h6" css={{ flex: 1 }} as="h6" ellipsify>
        {token?.token
          ? token.token.name || `#${token.token.tokenId}`
          : collection?.name}
      </Text>
      {token && (
        <Box>
          <Text style="subtitle2" color="subtle" as="p" ellipsify>
            {token?.token?.collection?.name}
          </Text>
        </Box>
      )}
    </Box>
  )
}

export default TokenStatsHeader
