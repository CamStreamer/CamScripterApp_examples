import { Controller, useFormContext, useWatch } from 'react-hook-form';
import { Button, CircularProgress, MenuItem, Radio, RadioGroup } from '@mui/material';
import { InputLabel, Select, FormHelperText } from '@mui/material';
import { styled } from '@mui/material/styles';

import { TSettings } from '../models/schema';
import { CollapsibleFormSection } from '../components/CollapsibleFormSection';
import { StyledTextField, StyledForm, StyledRow, StyledRadioControlLabel, StyledSelectField } from '../components/FormInputs';
import { Subtitle } from '../components/Title';
import { useLoadChannels, TFeedChannel } from '../hooks/useLoadChannels';

export const RssFeedSection = () => {
    const { control, setValue } = useFormContext<TSettings>();
    const { channels, isFetching, error: channelError, loadChannels } = useLoadChannels();

    const rssUrl = useWatch({ control, name: 'rss_url' });

    const handleLoadFeed = () => {
        void loadChannels(rssUrl);
    };

    return (
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
                    <StyledLoadButton
                        variant="contained"
                        color="info"
                        onClick={handleLoadFeed}
                        disabled={isFetching}
                    >
                        {isFetching ? <CircularProgress size={20} /> : 'Load Feed'}
                    </StyledLoadButton>
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
                                    channels.map((ch: TFeedChannel, idx: number) => (
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
    );
};

const StyledLoadButton = styled(Button)`
    height: 40px;
    align-self: flex-start;
    white-space: nowrap;
    min-width: 120px;
`;
