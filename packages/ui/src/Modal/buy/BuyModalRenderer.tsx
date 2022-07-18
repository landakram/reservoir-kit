import React, {
  FC,
  useEffect,
  useState,
  useMemo,
  useCallback,
  ReactNode,
} from 'react'
import {
  useCollection,
  useTokenDetails,
  useHistoricalSales,
  useEthConversion,
  useCoreSdk,
  useTokenOpenseaBanned,
  useSignerDetails,
} from '../../hooks'

import { Signer, utils } from 'ethers'
import { Execute } from '@reservoir0x/reservoir-kit-core'

export enum BuyStep {
  Checkout,
  Confirming,
  Finalizing,
  AddFunds,
  Complete,
  Unavailable,
}

type ChildrenProps = {
  token:
    | false
    | NonNullable<
        NonNullable<ReturnType<typeof useTokenDetails>>['tokens']
      >['0']
  collection: ReturnType<typeof useCollection>
  lastSale: ReturnType<typeof useHistoricalSales>
  totalPrice: number
  referrerFee: number
  buyStep: BuyStep
  transactionError?: Error | null
  hasEnoughEth: boolean
  txHash: string | null
  feeUsd: number
  totalUsd: number
  ethUsdPrice: ReturnType<typeof useEthConversion>
  isBanned: boolean
  signerDetails: ReturnType<typeof useSignerDetails>
  buyToken: () => void
  setBuyStep: React.Dispatch<React.SetStateAction<BuyStep>>
}

type Props = {
  open: boolean
  tokenId?: string
  collectionId?: string
  signer: Signer
  referrerFeeBps?: number
  referrer?: string
  children: (props: ChildrenProps) => ReactNode
}

export const BuyModalRenderer: FC<Props> = ({
  open,
  tokenId,
  collectionId,
  referrer,
  referrerFeeBps,
  signer,
  children,
}) => {
  const [totalPrice, setTotalPrice] = useState(0)
  const [referrerFee, setReferrerFee] = useState(0)
  const [buyStep, setBuyStep] = useState<BuyStep>(BuyStep.Checkout)
  const [transactionError, setTransactionError] = useState<Error | null>()
  const [hasEnoughEth, setHasEnoughEth] = useState(true)
  const [txHash, setTxHash] = useState<string | null>(null)

  const tokenQuery = useMemo(
    () => ({
      tokens: [`${collectionId}:${tokenId}`],
    }),
    [collectionId, tokenId]
  )

  const collectionQuery = useMemo(
    () => ({
      id: collectionId,
    }),
    [collectionId]
  )

  const salesQuery = useMemo(
    (): Parameters<typeof useHistoricalSales>['0'] => ({
      token: `${collectionId}:${tokenId}`,
      limit: 1,
    }),
    [collectionId, tokenId]
  )

  const tokenDetails = useTokenDetails(open && tokenQuery)
  const collection = useCollection(open && collectionQuery)
  const lastSale = useHistoricalSales(
    buyStep === BuyStep.Unavailable && salesQuery
  )
  let token = !!tokenDetails?.tokens?.length && tokenDetails?.tokens[0]

  const ethUsdPrice = useEthConversion(open ? 'USD' : undefined)
  const feeUsd = referrerFee * (ethUsdPrice || 0)
  const totalUsd = totalPrice * (ethUsdPrice || 0)

  const sdk = useCoreSdk()

  const buyToken = useCallback(() => {
    if (!tokenId || !collectionId) {
      throw 'Missing tokenId or collectionId'
    }

    if (!sdk) {
      throw 'ReservoirSdk was not initialized'
    }

    sdk.actions
      .buyToken({
        expectedPrice: totalPrice,
        signer,
        tokens: [
          {
            tokenId: tokenId,
            contract: collectionId,
          },
        ],
        onProgress: (steps: Execute['steps']) => {
          if (!steps) {
            return
          }

          const currentStep = steps.find((step) => step.status === 'incomplete')

          if (currentStep) {
            if (currentStep.txHash) {
              setTxHash(currentStep.txHash)
              setBuyStep(BuyStep.Finalizing)
            } else {
              setBuyStep(BuyStep.Confirming)
            }
          } else if (steps.every((step) => step.status === 'complete')) {
            setBuyStep(BuyStep.Complete)
          }
        },
        options: {
          referrer: referrer,
          referrerFeeBps: referrerFeeBps,
        },
      })
      .catch((e: any) => {
        const error = e as Error
        if (error && error?.message.includes('ETH balance')) {
          setHasEnoughEth(false)
        } else {
          const transactionError = new Error(error?.message || '', {
            cause: error,
          })
          setTransactionError(transactionError)
        }
        setBuyStep(BuyStep.Checkout)
        console.log(error)
      })
  }, [tokenId, collectionId, referrer, referrerFeeBps, sdk, signer])

  useEffect(() => {
    if (token) {
      if (token.market?.floorAsk?.price) {
        let floorPrice = token.market.floorAsk.price

        if (referrerFeeBps) {
          const fee = (referrerFeeBps / 10000) * floorPrice

          floorPrice = floorPrice + fee
          setReferrerFee(fee)
        }
        setTotalPrice(floorPrice)
      } else {
        setBuyStep(BuyStep.Unavailable)
        setTotalPrice(0)
      }
    }
  }, [tokenDetails, referrerFeeBps])

  const signerDetails = useSignerDetails(open && signer)

  useEffect(() => {
    if (
      signerDetails?.balance &&
      signerDetails.balance.lt(utils.parseEther(`${totalPrice}`))
    ) {
      setHasEnoughEth(false)
    }
  }, [totalPrice, signerDetails])

  const isBanned = useTokenOpenseaBanned(
    open ? collectionId : undefined,
    tokenId
  )

  return (
    <>
      {children({
        token,
        collection,
        lastSale,
        totalPrice,
        referrerFee,
        buyStep,
        transactionError,
        hasEnoughEth,
        txHash,
        feeUsd,
        totalUsd,
        ethUsdPrice,
        isBanned,
        signerDetails,
        buyToken,
        setBuyStep,
      })}
    </>
  )
}