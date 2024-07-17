import { CamOverlayDrawingOptions } from 'camstreamerlib/CamOverlayDrawingAPI';
import { Painter, PainterOptions, Frame, ResourceManager } from 'camstreamerlib/CamOverlayPainter/Painter';

const borderWidth = 5;
const imageWidth = 325;
const luxmeterHeight = 244;
const camstreamerHeight = 92;
export class Widget {
    private rm = new ResourceManager();
    private background: Painter;
    private camstreamer: Frame;
    private luxmeter: Frame;
    private border: Frame;
    private value: Frame;

    public constructor(
        opt: Omit<PainterOptions, 'width' | 'height'>,
        coOpt: CamOverlayDrawingOptions,
        private scale: number
    ) {
        this.rm.registerImage('Luxmeter', 'luxmeter.png');
        this.rm.registerImage('CamStreamer', 'camstreamer.png');

        this.background = new Painter(
            {
                ...opt,
                width: imageWidth,
                height: luxmeterHeight + camstreamerHeight,
            },
            coOpt,
            this.rm
        );
        this.luxmeter = new Frame(
            {
                x: borderWidth,
                y: borderWidth,
                width: imageWidth - 2 * borderWidth,
                height: luxmeterHeight - 2 * borderWidth,
                bgColor: [205 / 256, 206 / 256, 196 / 256, 1],
            },
            this.rm
        );
        this.camstreamer = new Frame(
            { x: 0, y: luxmeterHeight, width: imageWidth, height: camstreamerHeight, bgImage: 'CamStreamer' },
            this.rm
        );
        this.value = new Frame(
            {
                x: imageWidth / 8,
                y: luxmeterHeight / 16,
                width: imageWidth * (3 / 4),
                height: luxmeterHeight * (3 / 4),
            },
            this.rm
        );
        this.border = new Frame(
            {
                x: 0,
                y: 0,
                width: imageWidth,
                height: luxmeterHeight,
                bgColor: [27 / 256, 60 / 256, 112 / 256, 1],
            },
            this.rm
        );

        this.background.insert(this.border, this.luxmeter, this.value, this.camstreamer);
        void this.background.connect();
    }
    public display(value: number): Promise<void> {
        this.value.setText(value.toString(), 'A_CENTER', 'TFM_SCALE', [0, 0, 0]);
        return this.background.display(this.scale);
    }
}
