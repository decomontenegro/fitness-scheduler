import React from 'react'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { Loading } from '@/components/ui/Loading'

describe('Loading Component', () => {
  it('should render loading spinner', () => {
    render(<Loading />)
    const spinner = screen.getByRole('status')
    expect(spinner).toBeInTheDocument()
  })

  it('should have default size', () => {
    render(<Loading />)
    const spinner = screen.getByRole('status')
    expect(spinner).toHaveClass('h-8', 'w-8')
  })

  it('should accept small size prop', () => {
    render(<Loading size="small" />)
    const spinner = screen.getByRole('status')
    expect(spinner).toHaveClass('h-4', 'w-4')
  })

  it('should accept medium size prop', () => {
    render(<Loading size="medium" />)
    const spinner = screen.getByRole('status')
    expect(spinner).toHaveClass('h-8', 'w-8')
  })

  it('should accept large size prop', () => {
    render(<Loading size="large" />)
    const spinner = screen.getByRole('status')
    expect(spinner).toHaveClass('h-12', 'w-12')
  })

  it('should have spinning animation', () => {
    render(<Loading />)
    const spinner = screen.getByRole('status')
    expect(spinner).toHaveClass('animate-spin')
  })

  it('should have accessibility label', () => {
    render(<Loading />)
    const label = screen.getByText('Loading...')
    expect(label).toBeInTheDocument()
    expect(label).toHaveClass('sr-only')
  })

  it('should be centered when fullScreen is true', () => {
    render(<Loading fullScreen />)
    const container = screen.getByRole('status').parentElement
    expect(container).toHaveClass('fixed', 'inset-0', 'flex', 'items-center', 'justify-center')
  })

  it('should have background overlay when fullScreen is true', () => {
    render(<Loading fullScreen />)
    const container = screen.getByRole('status').parentElement
    expect(container).toHaveClass('bg-white/80')
  })

  it('should accept custom className', () => {
    render(<Loading className="custom-class" />)
    const spinner = screen.getByRole('status')
    expect(spinner).toHaveClass('custom-class')
  })
})