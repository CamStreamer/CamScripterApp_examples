import { useState } from 'react';
import Fade from '@mui/material/Fade';
import styled from '@mui/material/styles/styled';
import { Controller, useFormContext } from 'react-hook-form';

import { TSettings } from '../models/schema';
import { parseValueAsFloat } from '../utils';
import { CollapsibleFormSection } from '../components/CollapsibleFormSection';

import { StyledTextField } from '../components/FormInputs';
import { CameraList } from './CameraList';
import { WidgetSettings } from './WidgetSettings';
import { EventSettings } from './EventSettings';
import { AcsConnectParams } from './AcsConnectParams';
import { Title } from '../components/Title';

export function Form() {
    const { control } = useFormContext<TSettings>();
    const [areCredentialsValid, setAreCredentialsValid] = useState(true);
    return (
        <Fade in={true} timeout={1000}>
            <StyledForm>
                <CollapsibleFormSection label="Luxmeter settings" defaultExpanded={true}>
                    <Controller
                        name={'updateFrequency'}
                        control={control}
                        render={({ field, formState }) => (
                            <StyledTextField
                                defaultValue={field.value}
                                fullWidth
                                label="Update Frequency"
                                InputLabelProps={{ shrink: true }}
                                onBlur={(e) => {
                                    const val = parseValueAsFloat(e.target.value);
                                    field.onChange(val);
                                    e.target.value = val.toString();
                                }}
                                error={!!formState.errors.updateFrequency}
                                helperText={formState.errors.updateFrequency?.message}
                            />
                        )}
                    />
                </CollapsibleFormSection>
                <CollapsibleFormSection label="Camera source" defaultExpanded={false}>
                    <CameraList />
                </CollapsibleFormSection>
                <CollapsibleFormSection label="CamOverlay integration" defaultExpanded={false}>
                    <WidgetSettings />
                </CollapsibleFormSection>
                <CollapsibleFormSection label="Axis camera event" defaultExpanded={false}>
                    <EventSettings />
                </CollapsibleFormSection>
                <CollapsibleFormSection label="ACS integration" defaultExpanded={false}>
                    <Title text="Axis Camera Station settings" />
                    <AcsConnectParams
                        areCredentialsValid={areCredentialsValid}
                        setAreCredentialsValid={setAreCredentialsValid}
                    />
                </CollapsibleFormSection>
            </StyledForm>
        </Fade>
    );
}

const StyledForm = styled('div')({
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
    flexDirection: 'column',
});
