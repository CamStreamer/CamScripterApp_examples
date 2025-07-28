import { SubmitHandler, useFormContext, useWatch } from 'react-hook-form';
import { TSettings } from '../models/schema';
import { useState } from 'react';

type Props = {
    displaySnackbar: (data: { type: 'error' | 'success'; message: string }) => void;
};

export const useFlowMeterControl = ({ displaySnackbar }: Props) => {
    const { control, getValues } = useFormContext<TSettings>();
    const isFlowMeterStarted = useWatch({ name: 'started', control });

    const [started, setStarted] = useState(isFlowMeterStarted);
    const [isStopping, setIsStopping] = useState(false);
    const [isStarting, setIsStarting] = useState(false);

    const handleStart = async () => {
        setIsStarting(true);

        const formValues = getValues() as TSettings;
        const updatedData = { ...formValues, started: true };

        try {
            await saveAppSettings(updatedData);
            setStarted(true);

            displaySnackbar({
                type: 'success',
                message: 'Successfully started.',
            });
        } catch (err) {
            console.error('Error while starting flow meter:', err);
            displaySnackbar({
                type: 'error',
                message: 'Unable to start flow meter.',
            });
            setStarted(false);
        } finally {
            setIsStarting(false);
        }
    };

    const handleStop = async () => {
        setIsStopping(true);

        const formValues = getValues() as TSettings;
        const updatedData = { ...formValues, started: false };

        try {
            await saveAppSettings(updatedData);
            setStarted(false);

            displaySnackbar({
                type: 'success',
                message: 'Successfully stopped.',
            });
        } catch (err) {
            console.error('Error while stopping flow meter:', err);
            displaySnackbar({
                type: 'error',
                message: 'Unable to stop flow meter.',
            });
            setStarted(true);
        } finally {
            setIsStopping(false);
        }
    };

    const handleCalibrationStart = async () => {
        try {
            await fetch('/local/camscripter/proxy/flowmeter/calibration_start.cgi?');
        } catch (error) {
            console.error('Error starting calibration:', error);
        }
    };

    const handleCalibrationCalibrate = async (volume: number) => {
        try {
            const res = await fetch(`/local/camscripter/proxy/flowmeter/calibration_calibrate.cgi?volume=${volume}`);
            console.log('Calibration response:', res);

            if (!res.ok) {
                displaySnackbar({
                    type: 'error',
                    message: 'Unable to calibrate.',
                });
                return;
            }

            displaySnackbar({
                type: 'success',
                message: 'Successfully calibrated.',
            });
        } catch (error) {
            console.error('Error during calibration:', error);
            displaySnackbar({
                type: 'error',
                message: 'Unable to calibrate.',
            });
        }
    };

    const handleResetCounter = async () => {
        try {
            const res = await fetch('/local/camscripter/proxy/flowmeter/reset_counter.cgi');

            if (res.status === 400) {
                displaySnackbar({
                    type: 'error',
                    message: 'Unable to reset counter when the counting is running.',
                });
                return;
            }

            displaySnackbar({
                type: 'success',
                message: 'Successfully reset counter.',
            });
        } catch (error) {
            console.error('Counter reset error:', error);
            displaySnackbar({
                type: 'error',
                message: 'Unable to reset counter.',
            });
        }
    };

    const saveAppSettings: SubmitHandler<TSettings> = async (settings: TSettings) => {
        let url = '/local/camscripter/package/settings.cgi?package_name=flowmeter&action=set';
        if (process.env?.NODE_ENV === 'development') {
            url = 'http://localhost:52520' + url;
        }

        const res = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(settings),
        });
        if (!res.ok) {
            throw new Error(`${res.status}: ${res.statusText}`);
        }
    };

    return {
        handleStart,
        handleStop,
        handleResetCounter,
        handleCalibrationStart,
        handleCalibrationCalibrate,
        isStarting,
        isStopping,
        started,
    } as const;
};
