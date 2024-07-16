import {
    Painter,
    PainterOptions,
    Frame,
    ResourceManager,
    CamOverlayDrawingOptions,
} from 'camstreamerlib/CamOverlayPainter/Painter';

const imageWidth = 325;
const luxmeterHeight = 244;
const camstreamerHeight = 92;
export class Widget {
    private rm = new ResourceManager();
    private background: Painter;
    private camstreamer: Frame;
    private luxmeter: Frame;

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
            { x: 0, y: 0, width: imageWidth, height: luxmeterHeight, bgImage: 'Luxmeter' },
            this.rm
        );
        this.camstreamer = new Frame(
            { x: 0, y: luxmeterHeight, width: imageWidth, height: camstreamerHeight, bgImage: 'CamStreamer' },
            this.rm
        );

        this.background.insert(this.luxmeter, this.camstreamer);
        void this.background.connect();
    }
    public display(): Promise<void> {
        return this.background.display(this.scale);
    }
}
