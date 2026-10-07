import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Button } from './button';
import { ConfirmDialog } from './confirm-dialog';

describe('UI primitives', () => {
  it('renders a destructive button with an accessible name', () => {
    render(<Button variant="destructive">Xóa bản ghi</Button>);
    expect(screen.getByRole('button', { name: 'Xóa bản ghi' })).toHaveClass(
      'from-rose-600',
    );
  });

  it('applies semantic outline variants consistently', () => {
    render(
      <>
        <Button variant="dangerOutline">Ngừng lớp</Button>
        <Button variant="success">Kích hoạt</Button>
      </>,
    );
    expect(screen.getByRole('button', { name: 'Ngừng lớp' })).toHaveClass(
      'border-rose-200',
    );
    expect(screen.getByRole('button', { name: 'Kích hoạt' })).toHaveClass(
      'border-emerald-200',
    );
  });

  it('keeps the action label and disables interaction while loading', () => {
    render(<Button loading>Lưu học sinh</Button>);
    const button = screen.getByRole('button', { name: 'Lưu học sinh' });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(button.querySelector('svg')).toBeInTheDocument();
  });

  it('requires an explicit confirmation for destructive actions', () => {
    const onConfirm = vi.fn();
    render(
      <ConfirmDialog
        open
        onOpenChange={() => undefined}
        title="Hủy buổi học?"
        description="Dữ liệu lịch sử vẫn được giữ lại."
        onConfirm={onConfirm}
      />,
    );
    expect(screen.getByRole('alertdialog')).toHaveAccessibleName(
      'Hủy buổi học?',
    );
    fireEvent.click(screen.getByRole('button', { name: 'Xác nhận' }));
    expect(onConfirm).toHaveBeenCalledOnce();
  });
});
