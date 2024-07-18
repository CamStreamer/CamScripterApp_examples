import { CamOverlayDrawingOptions } from 'camstreamerlib/CamOverlayDrawingAPI';
import { Painter, PainterOptions, Frame, ResourceManager } from 'camstreamerlib/CamOverlayPainter/Painter';

const imageWidth = 325;
const luxmeterHeight = 254;
const camstreamerHeight = 92;

function toString(value: number): string {
    if (value === 0 || isNaN(value)) {
        return 'ERROR';
    } else {
        const text = value.toPrecision(4);
        return text.substring(0, 6);
    }
}

export class Widget {
    private rm = new ResourceManager();
    private background: Painter;
    private camstreamer: Frame;
    private luxmeter: Frame;
    private value: Frame;
    private scale: number;

    public constructor(
        opt: Omit<PainterOptions, 'width' | 'height'> & { scale: number },
        coOpt: CamOverlayDrawingOptions
    ) {
        this.scale = opt.scale;
        this.rm.registerFont('Digital', 'digital_font.ttf');
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
                x: 0,
                y: 0,
                width: imageWidth,
                height: luxmeterHeight,
                bgImage: 'Luxmeter',
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

        this.value.setFont('Digital');
        this.background.insert(this.luxmeter, this.value, this.camstreamer);
        void this.background.connect();
    }
    public display(value: number): Promise<void> {
        this.value.setText(toString(value), 'A_CENTER', 'TFM_SCALE', [0, 0, 0]);
        return this.background.display(this.scale);
    }
}
