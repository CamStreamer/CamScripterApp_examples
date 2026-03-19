import { Controller, useFormContext, useWatch } from 'react-hook-form';
import {
    Button,
    CircularProgress,
    IconButton,
    InputAdornment,
    MenuItem,
    Radio,
    RadioGroup,
    Typography,
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { useState } from 'react';

import { TSettings } from '../models/schema';
import { CollapsibleFormSection } from '../components/CollapsibleFormSection';
import {
    StyledTextField,
    StyledSection,
    StyledForm,
    StyledRow,
    StyledRadioControlLabel,
} from '../components/FormInputs';
import { StyledSelectField } from '../components/FormInputs';
import { InputLabel, Select, FormHelperText } from '@mui/material';
import { Subtitle } from '../components/Title';
import { useLoadChannels } from '../hooks/useLoadChannels';

export const Form = () => {
    const { control, setValue } = useFormContext<TSettings>();
    const [showPassword, setShowPassword] = useState(false);
    const { channels, isFetching, error: channelError, loadChannels } = useLoadChannels();

    const rssUrl = useWatch({ control, name: 'rss_url' });
    const outputType = useWatch({ control, name: 'output_type' });

    const handleLoadFeed = () => {
        void loadChannels(rssUrl);
    };

    return (
        <StyledSection style={{ padding: '16px', gap: '24px' }}>
            {/* Camera Connection */}
            <CollapsibleFormSection label="Camera Connection" defaultExpanded={true}>
                <StyledForm>
                    <StyledRow>
                        <Controller
                            name="camera_ip"
                            control={control}
                            render={({ field, fieldState }) => (
                                <StyledTextField
                                    {...field}
                                    label="Camera IP"
                                    placeholder="127.0.0.1"
                                    size="small"
                                    error={!!fieldState.error}
                                    helperText={fieldState.error?.message}
                                />
                            )}
                        />
                        <Controller
                            name="camera_port"
                            control={control}
                            render={({ field, fieldState }) => (
                                <StyledTextField
                                    {...field}
                                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                    label="Camera Port"
                                    placeholder="80"
                                    size="small"
                                    type="number"
                                    error={!!fieldState.error}
                                    helperText={fieldState.error?.message}
                                />
                            )}
                        />
                    </StyledRow>
                    <StyledRow>
                        <Controller
                            name="camera_user"
                            control={control}
                            render={({ field, fieldState }) => (
                                <StyledTextField
                                    {...field}
                                    label="Camera User"
                                    placeholder="root"
                                    size="small"
                                    error={!!fieldState.error}
                                    helperText={fieldState.error?.message}
                                />
                            )}
                        />
                        <Controller
                            name="camera_pass"
                            control={control}
                            render={({ field, fieldState }) => (
                                <StyledTextField
                                    {...field}
                                    label="Camera Password"
                                    placeholder="password"
                                    size="small"
                                    type={showPassword ? 'text' : 'password'}
                                    autoComplete="new-password"
                                    error={!!fieldState.error}
                                    helperText={fieldState.error?.message}
                                    InputProps={{
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <IconButton
                                                    onClick={() => setShowPassword((prev) => !prev)}
                                                    edge="end"
                                                    size="small"
                                                >
                                                    {showPassword ? <VisibilityOff /> : <Visibility />}
                                                </IconButton>
                                            </InputAdornment>
                                        ),
                                    }}
                                />
                            )}
                        />
                    </StyledRow>
                </StyledForm>
            </CollapsibleFormSection>

            {/* RSS Feed */}
            <CollapsibleFormSection label="RSS Feed" defaultExpanded={true}>
                <StyledForm>
                    <StyledRow>
                        <Controller
                            name="rss_url"
                            control={control}
                            render={({ field, fieldState }) => (
                                <StyledTextField
                                    {...field}
                                    label="RSS Feed URL"
                                    placeholder="https://www.nasa.gov/rss/dyn/breaking_news.rss"
                                    size="small"
                                    error={!!fieldState.error}
                                    helperText={fieldState.error?.message}
                                />
                            )}
                        />
                        <Button
                            variant="contained"
                            color="info"
                            onClick={handleLoadFeed}
                            disabled={isFetching}
                            sx={{ height: 40, alignSelf: 'flex-start', whiteSpace: 'nowrap', minWidth: 120 }}
                        >
                            {isFetching ? <CircularProgress size={20} /> : 'Load Feed'}
                        </Button>
                    </StyledRow>

                    <Controller
                        name="channel_name"
                        control={control}
                        render={({ field }) => (
                            <StyledSelectField size="small">
                                <InputLabel id="channel-label">Channel</InputLabel>
                                <Select
                                    {...field}
                                    label="Channel"
                                    labelId="channel-label"
                                    onChange={(e) => {
                                        field.onChange(e);
                                        setValue('channel_name', e.target.value as string);
                                    }}
                                >
                                    {channels.length > 0 ? (
                                        channels.map((ch, idx) => (
                                            <MenuItem key={idx} value={ch.title}>
                                                {ch.title}
                                            </MenuItem>
                                        ))
                                    ) : (
                                        <MenuItem value="" disabled>
                                            {channelError || 'No channel available'}
                                        </MenuItem>
                                    )}
                                </Select>
                                <FormHelperText>
                                    {channelError && channels.length === 0 ? channelError : ''}
                                </FormHelperText>
                            </StyledSelectField>
                        )}
                    />

                    <div>
                        <Subtitle text="Content to display" />
                        <Controller
                            name="content_type"
                            control={control}
                            render={({ field }) => (
                                <RadioGroup {...field} row>
                                    <StyledRadioControlLabel value="title" label="Title" control={<Radio />} />
                                    <StyledRadioControlLabel
                                        value="description"
                                        label="Description"
                                        control={<Radio />}
                                    />
                                </RadioGroup>
                            )}
                        />
                    </div>
                </StyledForm>
            </CollapsibleFormSection>

            {/* Output */}
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
                                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
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
                        name="update_interval"
                        control={control}
                        render={({ field, fieldState }) => (
                            <StyledTextField
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
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
        </StyledSection>
    );
};
