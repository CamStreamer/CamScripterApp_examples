import { InfoSnackbar, TSnackBarData } from './components/Snackbar';
import React, { useRef, useState } from 'react';
import { TFormValues, TServerData, serverDataSchema } from './form/models/schema';

import Container from '@mui/material/Container';
import { ContainerLoader } from './components/ContainerLoader';
import { Form } from './form/Form';
import { Nav } from './components/Nav';
import { ZodError } from 'zod';
import styled from 'styled-components';
import { useInitializeOnMount } from './hooks/useInitializeOnMount';

export const App = () => {
    const [defaultValues, setDefaultValues] = useState<TFormValues | null>(null);
    const [snackbarData, setSnackbarData] = useState<TSnackBarData | null>(null);

    const lastSnackIdRef = useRef<TSnackBarData['id'] | null>(null);

    const displaySnackbar = (val: TSnackBarData) => {
        if (lastSnackIdRef.current === val.id) {
            return;
        } else {
            lastSnackIdRef.current = val.id;
            setSnackbarData(val);
        }
    };

    const closeSnackbar = () => {
        lastSnackIdRef.current = null;
        setSnackbarData(null);
    };

    useInitializeOnMount(async () => {
        let response: Response;
        let data: TServerData;
        try {
            response = await fetch(
                '/local/camscripter/package/settings.cgi?package_name=barcodeReaderAndUploader&action=get'
            );
            data = await response.json();

            const parsedData = serverDataSchema.parse(data);

            const flatData = (Object.keys(parsedData) as (keyof TServerData)[]).reduce((accFlatData, currKey) => {
                const d = {
                    ...accFlatData,
                    ...data[currKey],
                };
                return d;
            }, {} as TFormValues);

            setDefaultValues(flatData);
        } catch (e) {
            if (e instanceof ZodError) {
                displaySnackbar({
                    id: 'initialDataFetchInfo',
                    type: 'error',
                    message: 'Data from server do not match expected data',
                });
            } else {
                displaySnackbar({
                    id: 'initialDataFetchInfo',
                    type: 'error',
                    message: 'Error fetching form data.',
                });
            }

            console.error('Error while fetching default values: ', e);
            setDefaultValues(null);
        }
    });

    return (
        <>
            <Nav />
            <StyledContainer>
                {defaultValues ? (
                    <Form defaultValues={defaultValues} displaySnackbar={displaySnackbar} />
                ) : (
                    <ContainerLoader size={80} infoText="Fetching settings..." />
                )}
            </StyledContainer>
            <InfoSnackbar snackbarData={snackbarData} closeSnackbar={closeSnackbar} />
        </>
    );
};

const StyledContainer = styled(Container)`
    min-height: 100%;
`;
