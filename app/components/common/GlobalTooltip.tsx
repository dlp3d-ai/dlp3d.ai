'use client'

import React from 'react'
import Tooltip, { TooltipProps } from '@mui/material/Tooltip'
import InfoOutlined from '@mui/icons-material/InfoOutlined'
import { useDevice } from '@/contexts/DeviceContext'

type GlobalTooltipProps = Omit<TooltipProps, 'title' | 'children'> & {
  content: string | string[] | React.ReactNode
  children?: React.ReactNode
  iconStyle?: React.CSSProperties
  titleProps?: React.HTMLAttributes<HTMLSpanElement>
  popperZIndex?: number
}

/**
 * GlobalTooltip component.
 *
 * Renders a tooltip with content from i18n t() strings or custom nodes.
 * Newlines in string content are rendered as line breaks.
 * If no children are provided, an info icon is used as the trigger.
 *
 * @param content The tooltip content: a t() string (supports \n), or an array rendered line-by-line.
 * @param children Optional custom trigger element; defaults to an info icon.
 * @param iconStyle Optional inline styles applied to the default icon.
 * @param titleProps Optional props applied to the content wrapper element.
 *
 * @returns JSX.Element The tooltip-wrapped trigger element.
 */
export default function GlobalTooltip({
  content,
  children,
  iconStyle,
  titleProps,
  arrow = true,
  placement = 'top',
  popperZIndex = 20000,
  ...rest
}: GlobalTooltipProps) {
  const { isMobile } = useDevice()
  const [open, setOpen] = React.useState(false)
  const titleNode = Array.isArray(content) ? (
    <span
      style={{ whiteSpace: 'pre-wrap', display: 'inline-block', zIndex: 20000 }}
      {...titleProps}
    >
      {content.map((line, idx) => (
        <React.Fragment key={idx}>
          {line}
          {idx < content.length - 1 ? <br /> : null}
        </React.Fragment>
      ))}
    </span>
  ) : typeof content === 'string' ? (
    <span style={{ whiteSpace: 'pre-line', zIndex: 20000 }} {...titleProps}>
      {content}
    </span>
  ) : (
    content
  )

  const mergedComponentsProps = {
    ...rest.componentsProps,
    tooltip: {
      ...rest.componentsProps?.tooltip,
      sx: {
        bgcolor: '#1e202d',
        color: '#fff',
        fontSize: 14,
        lineHeight: 1.6,
        padding: '10px',
        borderRadius: '10px',
        maxWidth: 360,
        overflowWrap: 'break-word',
        wordBreak: 'break-word',
        zIndex: '20000 !important',
        ...(rest.componentsProps?.tooltip as any)?.sx,
      },
    },
    arrow: {
      ...rest.componentsProps?.arrow,
      sx: {
        color: '#1e202d',
        ...(rest.componentsProps?.arrow as any)?.sx,
      },
    },
    popper: {
      ...rest.componentsProps?.popper,
      sx: {
        zIndex: popperZIndex,
        ...(rest.componentsProps?.popper as any)?.sx,
      },
    },
  }

  const mergedSlotProps = {
    ...rest.slotProps,
    popper: {
      ...(rest.slotProps as any)?.popper,
      sx: {
        zIndex: popperZIndex,
        ...((rest.slotProps as any)?.popper?.sx || {}),
      },
    },
  }

  const trigger = children ?? (
    <InfoOutlined
      fontSize="small"
      style={{ opacity: 0.8, cursor: 'help', verticalAlign: 'middle', ...iconStyle }}
    />
  )

  return (
    <Tooltip
      title={titleNode}
      arrow={arrow}
      placement={placement}
      open={isMobile ? open : undefined}
      onClose={() => {
        if (!isMobile) return
        setOpen(false)
      }}
      onOpen={() => {
        if (!isMobile) return
        setOpen(true)
      }}
      disableFocusListener={isMobile}
      disableHoverListener={isMobile}
      disableTouchListener={isMobile}
      {...rest}
      componentsProps={mergedComponentsProps}
      slotProps={mergedSlotProps}
      PopperProps={{
        ...(rest as any).PopperProps,
        style: {
          zIndex: popperZIndex,
          ...((rest as any).PopperProps?.style || {}),
        },
        modifiers: [
          ...(((rest as any).PopperProps?.modifiers as any[]) || []),
          { name: 'offset', options: { offset: [0, 8] } },
          {
            name: 'flip',
            options: {
              altBoundary: true,
              fallbackPlacements: ['top', 'bottom', 'right', 'left'],
              padding: 8,
            },
          },
          {
            name: 'preventOverflow',
            options: {
              altBoundary: true,
              tether: true,
              boundary: 'viewport',
              padding: 8,
            },
          },
        ],
      }}
      sx={{ zIndex: 20000 }}
    >
      {/* span ensures a valid single child for Tooltip when using plain text */}
      <span
        style={{ display: 'inline-flex', alignItems: 'center' }}
        onClick={isMobile ? () => setOpen(prev => !prev) : undefined}
        role={isMobile ? 'button' : undefined}
        tabIndex={isMobile ? 0 : undefined}
      >
        {trigger}
      </span>
    </Tooltip>
  )
}
