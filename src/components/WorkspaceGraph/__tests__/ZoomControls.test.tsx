import { render, screen, fireEvent } from '@testing-library/react';
import { ZoomControls } from '../ZoomControls';

describe('ZoomControls', () => {
    const onZoomIn = vi.fn();
    const onZoomOut = vi.fn();
    const onReset = vi.fn();

    beforeEach(() => {
        onZoomIn.mockClear();
        onZoomOut.mockClear();
        onReset.mockClear();
    });

    it('renders all zoom controls', () => {
        render(
            <ZoomControls
                onZoomIn={onZoomIn}
                onZoomOut={onZoomOut}
                onReset={onReset}
            />
        );

        expect(screen.getByLabelText('Zoom in')).toBeInTheDocument();
        expect(screen.getByLabelText('Zoom out')).toBeInTheDocument();
        expect(screen.getByLabelText('Reset zoom')).toBeInTheDocument();
    });

    it('calls zoom in handler', () => {
        render(
            <ZoomControls
                onZoomIn={onZoomIn}
                onZoomOut={onZoomOut}
                onReset={onReset}
            />
        );

        fireEvent.click(screen.getByLabelText('Zoom in'));
        expect(onZoomIn).toHaveBeenCalled();
    });

    it('calls zoom out handler', () => {
        render(
            <ZoomControls
                onZoomIn={onZoomIn}
                onZoomOut={onZoomOut}
                onReset={onReset}
            />
        );

        fireEvent.click(screen.getByLabelText('Zoom out'));
        expect(onZoomOut).toHaveBeenCalled();
    });

    it('calls reset handler', () => {
        render(
            <ZoomControls
                onZoomIn={onZoomIn}
                onZoomOut={onZoomOut}
                onReset={onReset}
            />
        );

        fireEvent.click(screen.getByLabelText('Reset zoom'));
        expect(onReset).toHaveBeenCalled();
    });

    it('applies custom className', () => {
        render(
            <ZoomControls
                onZoomIn={onZoomIn}
                onZoomOut={onZoomOut}
                onReset={onReset}
                className="custom-class"
            />
        );

        expect(screen.getByRole('group')).toHaveClass('custom-class');
    });
}); 