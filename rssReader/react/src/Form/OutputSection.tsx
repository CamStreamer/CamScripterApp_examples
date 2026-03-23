import { Controller, useFormContext, useWatch } from 'react-hook-form';
import { Radio, RadioGroup, Typography } from '@mui/material';
import React from 'react';

import { TSettings } from '../models/schema';
import { CollapsibleFormSection } from '../components/CollapsibleFormSection';
import { StyledTextField, StyledForm, StyledRow, StyledRadioControlLabel } from '../components/FormInputs';
import { Subtitle } from '../components/Title';

export const OutputSection = () => {
    const { control } = useFormContext<TSettings>();
    const outputType = useWatch({ control, name: 'output_type' });

    return (
        <CollapsibleFormSection label="Output" defaultExpanded={true}>
            <StyledForm>
                <div>
                    <Subtitle text="Output type" />
                    <Controller
                        name="output_type"
                        control={control}
                        render={({ field }) => (
                            <RadioGroup {...field} row>
                                <StyledRadioControlLabel
                                    value="infoticker"
                                    label="Infoticker"
                                    control={<Radio />}
                                />
                                <StyledRadioControlLabel
                                    value="custom_graphics"
                                    label="Custom Graphics"
                                    control={<Radio />}
                                />
                            </RadioGroup>
                        )}
                    />
                </div>

                <StyledRow>
                    <Controller
                        name="service_id"
                        control={control}
                        render={({ field, fieldState }) => (
                            <StyledTextField
                                {...field}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => field.onChange(parseInt(e.target.value) || 0)}
                                label="Service ID (Widget ID)"
                                placeholder="1"
                                size="small"
                                type="number"
                                error={!!fieldState.error}
                                helperText={fieldState.error?.message}
                            />
                        )}
                    />
                    {outputType === 'custom_graphics' && (
                        <Controller
                            name="cg_field_name"
                            control={control}
                            render={({ field, fieldState }) => (
                                <StyledTextField
                                    {...field}
                                    label="Field Name"
                                    placeholder="field1"
                                    size="small"
                                    error={!!fieldState.error}
                                    helperText={fieldState.error?.message}
                                />
                            )}
                        />
                    )}
                </StyledRow>

                <Controller
                    name="update_interval_s"
                    control={control}
                    render={({ field, fieldState }) => (
                        <StyledTextField
                            {...field}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => field.onChange(parseInt(e.target.value) || 0)}
                            label="Update Interval (seconds)"
                            placeholder="10"
                            size="small"
                            type="number"
                            error={!!fieldState.error}
                            helperText={fieldState.error?.message}
                        />
                    )}
                />

                {outputType === 'custom_graphics' && (
                    <Typography variant="body2" color="text.secondary">
                        The field name must match a named field in your CamOverlay Custom Graphics service.
                    </Typography>
                )}
            </StyledForm>
        </CollapsibleFormSection>
    );
};
