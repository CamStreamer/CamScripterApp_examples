import { useState } from 'react';
import { Box, Container, CssBaseline, Typography } from '@mui/material';
import styled from '@mui/material/styles/styled';

import { Nav } from './components/Nav';
import { ContainerLoader } from './components/ContainerLoader';
import { TServerData /* serverDataSchema*/, serverDataSchema } from './models/schema';
import { useInitializeOnMount } from './hooks/useInitializeOnMount';
import { ZodError } from 'zod';
import { useSnackbar } from './hooks/useSnackbar';
import { Headline } from './components/Title';
import { FormWrapper } from './Form/FormWrapper';
import { mockedSettings } from './models/mock';

export const App = () => {
    const { displaySnackbar } = useSnackbar();

    const [defaultValues, setDefaultValues] = useState<TServerData | null>(null);

    useInitializeOnMount(async () => {
        let response: Response;
        let data: TServerData;
        try {
            let url = '/local/camscripter/package/settings.cgi?package_name=video_checkpoint&action=get';
            if (process.env!.NODE_ENV === 'development') {
                url = 'http://localhost:52520' + url;
            }

            response = await fetch(url);
            data = await response.json();
            const parsedData = serverDataSchema.parse(data);
            if (!parsedData.axis_events) {
                parsedData.axis_events = {
                    conn_hub: true,
                    camera: false,
                };
            }
            setDefaultValues(parsedData);
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
            setDefaultValues(mockedSettings);
        }
    });

    return (
        <>
            <Nav />
            <StyledContainer>
                <CssBaseline />
                <StyledContentWrapper>
                    <StyledHeader>
                        <Headline text={'Video checkpoint micro app'} />
                        <Typography>
                            A solution for retail, warehousing and manufacturing clients to retrieve barcode scanner
                            data, overlay data on a video stream and upload media content to&nbsp;FTP or Google Drive or
                            send an event to Axis Camera Station.
                        </Typography>
                    </StyledHeader>
                    {defaultValues ? (
                        <FormWrapper defaultValues={defaultValues} />
                    ) : (
                        <ContainerLoader size={80} infoText="Fetching settings..." />
                    )}
                </StyledContentWrapper>
            </StyledContainer>
        </>
    );
};

const StyledContainer = styled(Container)`
    width: 100%;
    display: flex;
    flex-direction: column;
    flex: 1;
    align-items: center;

    & > div {
        flex: 1;
    }
`;

const StyledContentWrapper = styled(Box)({
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
});

const StyledHeader = styled(Box)`
    display: flex;
    flex-direction: column;
    width: 100%;
    background-color: white;
    padding: 16px;
    padding-bottom: 30px;
    gap: 8px;
`;
