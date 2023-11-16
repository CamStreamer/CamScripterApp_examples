import { CircularProgress, Container } from '@mui/material';
import React, { useEffect, useState } from 'react';
import { TFormValues, TServerData, formSchema, serverDataSchema } from './form/models/schema';

import { ContainerLoader } from './components/ContainerLoader';
import { Form } from './form/Form';
import { InfoSnackbar } from './components/Snackbar';
import { Nav } from './components/Nav';
import { ZodError } from 'zod';
import styled from 'styled-components';
import { useInitializeOnMount } from './hooks/useInitializeOnMount';
import { useSnackbar } from './hooks/useSnackbar';

export const App = () => {
    const [defaultValues, setDefaultValues] = useState<TFormValues | null>(null);
    const { snackbarData, displaySnackbar, closeSnackbar } = useSnackbar();

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
                    type: 'error',
                    message: 'Data from server do not match expected data',
                });
            } else {
                displaySnackbar({
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
                <InfoSnackbar snackbarData={snackbarData} closeSnackbar={closeSnackbar} />
                {defaultValues ? <Form defaultValues={defaultValues} /> : <ContainerLoader size={80} />}
            </StyledContainer>
        </>
    );
};

const StyledContainer = styled(Container)`
    height: 100%;
`;
