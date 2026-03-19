import { useState } from 'react';
import { Box, Container, CssBaseline, Typography } from '@mui/material';
import styled from '@mui/material/styles/styled';

import { Nav } from './components/Nav';
import { ContainerLoader } from './components/ContainerLoader';
import { TSettings, settingsSchema } from './models/schema';
import { useInitializeOnMount } from './hooks/useInitializeOnMount';
import { ZodError } from 'zod';
import { useSnackbar } from './hooks/useSnackbar';
import { Headline } from './components/Title';
import { FormWrapper } from './Form/FormWrapper';
import { mockedSettings } from './models/mock';

const PACKAGE_NAME = 'rss_reader';

export const App = () => {
    const { displaySnackbar } = useSnackbar();

    const [defaultValues, setDefaultValues] = useState<TSettings | null>(null);

    useInitializeOnMount(async () => {
        try {
            let url = `/local/camscripter/package/settings.cgi?package_name=${PACKAGE_NAME}&action=get`;
            if (process.env.NODE_ENV === 'development') {
                url = 'http://localhost:52520' + url;
            }

            const response = await fetch(url);
            const data = await response.json();
            const parsedData = settingsSchema.parse(data);
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
                        <Headline text={'RSS Reader'} />
                        <Typography>
                            Reads RSS/Atom feeds and pushes article titles or descriptions to CamOverlay App infoticker
                            or custom graphics widget.
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
