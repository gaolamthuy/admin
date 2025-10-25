/**
 * ProductFavoriteFilter Component Tests
 * @module components/products/__tests__/ProductFavoriteFilter
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';

import { ProductFavoriteFilter } from '../ProductFavoriteFilter';

describe('ProductFavoriteFilter', () => {
  describe('Rendering', () => {
    it('should render toggle button', () => {
      render(<ProductFavoriteFilter />);

      const toggle = screen.getByRole('button', {
        name: /toggle favorite products/i,
      });
      expect(toggle).toBeInTheDocument();
    });

    it('should render with Heart icon', () => {
      render(<ProductFavoriteFilter />);

      const toggle = screen.getByRole('button');
      expect(toggle).toBeInTheDocument();
      // Heart icon is rendered as SVG
      const svg = toggle.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('should render with "Yêu thích" text', () => {
      render(<ProductFavoriteFilter />);

      expect(screen.getByText('Yêu thích')).toBeInTheDocument();
    });

    it('should render with custom aria-label', () => {
      render(<ProductFavoriteFilter aria-label="Filter favorites" />);

      const toggle = screen.getByRole('button', { name: /filter favorites/i });
      expect(toggle).toBeInTheDocument();
    });
  });

  describe('Toggle Behavior', () => {
    it('should toggle from unpressed to pressed', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();

      render(
        <ProductFavoriteFilter pressed={false} onPressedChange={handleChange} />
      );

      const toggle = screen.getByRole('button');
      await user.click(toggle);

      expect(handleChange).toHaveBeenCalledWith(true);
      expect(handleChange).toHaveBeenCalledTimes(1);
    });

    it('should toggle from pressed to unpressed', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();

      render(
        <ProductFavoriteFilter pressed={true} onPressedChange={handleChange} />
      );

      const toggle = screen.getByRole('button');
      await user.click(toggle);

      expect(handleChange).toHaveBeenCalledWith(false);
      expect(handleChange).toHaveBeenCalledTimes(1);
    });

    it('should handle multiple toggles', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();

      const TestComponent = () => {
        const [pressed, setPressed] = React.useState(false);
        return (
          <ProductFavoriteFilter
            pressed={pressed}
            onPressedChange={value => {
              setPressed(value);
              handleChange(value);
            }}
          />
        );
      };

      render(<TestComponent />);

      const toggle = screen.getByRole('button');

      await user.click(toggle);
      expect(handleChange).toHaveBeenNthCalledWith(1, true);

      await user.click(toggle);
      expect(handleChange).toHaveBeenNthCalledWith(2, false);

      await user.click(toggle);
      expect(handleChange).toHaveBeenNthCalledWith(3, true);

      expect(handleChange).toHaveBeenCalledTimes(3);
    });
  });

  describe('Props Handling', () => {
    it('should apply pressed state correctly', () => {
      const { rerender } = render(<ProductFavoriteFilter pressed={false} />);

      let toggle = screen.getByRole('button');
      expect(toggle).toHaveAttribute('data-state', 'off');

      rerender(<ProductFavoriteFilter pressed={true} />);

      toggle = screen.getByRole('button');
      expect(toggle).toHaveAttribute('data-state', 'on');
    });

    it('should be disabled when disabled prop is true', () => {
      render(<ProductFavoriteFilter disabled={true} />);

      const toggle = screen.getByRole('button');
      expect(toggle).toBeDisabled();
    });

    it('should not call onChange when disabled', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();

      render(
        <ProductFavoriteFilter disabled={true} onPressedChange={handleChange} />
      );

      const toggle = screen.getByRole('button');
      await user.click(toggle);

      expect(handleChange).not.toHaveBeenCalled();
    });

    it('should apply custom className', () => {
      render(<ProductFavoriteFilter className="custom-class" />);

      const toggle = screen.getByRole('button');
      expect(toggle).toHaveClass('custom-class');
    });

    it('should apply variant prop', () => {
      const { rerender } = render(<ProductFavoriteFilter variant="outline" />);

      let toggle = screen.getByRole('button');
      expect(toggle).toBeInTheDocument();

      rerender(<ProductFavoriteFilter variant="default" />);
      toggle = screen.getByRole('button');
      expect(toggle).toBeInTheDocument();

      rerender(<ProductFavoriteFilter variant="ghost" />);
      toggle = screen.getByRole('button');
      expect(toggle).toBeInTheDocument();
    });

    it('should apply size prop', () => {
      const { rerender } = render(<ProductFavoriteFilter size="sm" />);

      let toggle = screen.getByRole('button');
      expect(toggle).toBeInTheDocument();

      rerender(<ProductFavoriteFilter size="default" />);
      toggle = screen.getByRole('button');
      expect(toggle).toBeInTheDocument();

      rerender(<ProductFavoriteFilter size="lg" />);
      toggle = screen.getByRole('button');
      expect(toggle).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA label', () => {
      render(<ProductFavoriteFilter aria-label="Toggle favorite filter" />);

      const toggle = screen.getByRole('button', {
        name: /toggle favorite filter/i,
      });
      expect(toggle).toBeInTheDocument();
    });

    it('should be keyboard accessible', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();

      render(
        <ProductFavoriteFilter pressed={false} onPressedChange={handleChange} />
      );

      const toggle = screen.getByRole('button');
      toggle.focus();

      expect(toggle).toHaveFocus();

      await user.keyboard('{Enter}');
      expect(handleChange).toHaveBeenCalledWith(true);
    });

    it('should support Space key', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();

      render(
        <ProductFavoriteFilter pressed={false} onPressedChange={handleChange} />
      );

      const toggle = screen.getByRole('button');
      toggle.focus();

      await user.keyboard(' ');
      expect(handleChange).toHaveBeenCalledWith(true);
    });
  });

  describe('Default Values', () => {
    it('should use default pressed value (false)', () => {
      render(<ProductFavoriteFilter />);

      const toggle = screen.getByRole('button');
      expect(toggle).toHaveAttribute('data-state', 'off');
    });

    it('should use default aria-label', () => {
      render(<ProductFavoriteFilter />);

      const toggle = screen.getByRole('button', {
        name: /toggle favorite products/i,
      });
      expect(toggle).toBeInTheDocument();
    });

    it('should not be disabled by default', () => {
      render(<ProductFavoriteFilter />);

      const toggle = screen.getByRole('button');
      expect(toggle).not.toBeDisabled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined onPressedChange', async () => {
      const user = userEvent.setup();

      render(<ProductFavoriteFilter />);

      const toggle = screen.getByRole('button');
      await user.click(toggle);

      // Should not throw error
      expect(toggle).toBeInTheDocument();
    });

    it('should handle rapid clicks', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();

      render(
        <ProductFavoriteFilter pressed={false} onPressedChange={handleChange} />
      );

      const toggle = screen.getByRole('button');

      await user.tripleClick(toggle);

      expect(handleChange).toHaveBeenCalled();
    });
  });
});
