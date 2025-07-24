import { SubmitHandler, useFormContext } from 'react-hook-form';
import { TSettings } from '../models/schema';
import { useSnackbar } from './useSnackbar';
import { useState } from 'react';

export const useFlowMeterControl = () => {
    const { getValues } = useFormContext();
    const { displaySnackbar } = useSnackbar();

    const [isStopping, setIsStopping] = useState(false);
    const [isStarting, setIsStarting] = useState(false);

    const handleStart = async () => {
        const formValues = getValues() as TSettings;
        const updatedData = { ...formValues, started: true };

        try {
            await saveAppSettings(updatedData);
            setIsStarting(true);

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
        } finally {
            setIsStarting(false);
        }
    };

    const handleStop = async () => {
        const formValues = getValues() as TSettings;
        const updatedData = { ...formValues, started: false };

        try {
            await saveAppSettings(updatedData);
            setIsStopping(true);

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
            await fetch(`/local/camscripter/proxy/flowmeter/calibration_calibrate.cgi?volume=${volume}`);
        } catch (error) {
            console.error('Error during calibration:', error);
        }
    };

    const handleResetCounter = async () => {
        try {
            await fetch('/local/camscripter/proxy/flowmeter/reset_counter.cgi');

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
    } as const;
};
