import { Controller, useFormContext } from 'react-hook-form';
import { TSettings } from '../models/schema';
import { InputAdornment, MenuItem, Radio, RadioGroup } from '@mui/material';
import { StyledTextField, StyledSelect, StyledForm, StyledRadioControlLabel } from '../components/FormInputs';
import { parseValueAsInt, parseValueAsFloat } from '../utils';
import { Title } from '../components/Title';
import { COORD_LIST, COORD_LIST_LABELS, OVERLAY_TYPES, OVERLAY_TYPES_LABELS } from '../constants';

type Props = {
    resolutionOptions: string[];
};

export const WidgetSettings = ({ resolutionOptions }: Props) => {
    const { control } = useFormContext<TSettings>();

    return (
        <StyledForm>
            <Title text="Graphics settings" />

            {/* ------RESOLUTION------*/}
            <Controller
                name={'resolution'}
                control={control}
                render={({ field }) => (
                    <StyledSelect
                        defaultValue={field.value}
                        {...field}
                        label="Resolution"
                        disabled={resolutionOptions.length === 0}
                    >
                        {resolutionOptions.map((option) => (
                            <MenuItem key={option} value={option}>
                                {option}
                            </MenuItem>
                        ))}
                    </StyledSelect>
                )}
            />

            {/* ------POSITION------*/}
            <Controller
                name={'coord'}
                control={control}
                render={({ field }) => (
                    <StyledSelect {...field} label="Position">
                        {COORD_LIST.map((value) => (
                            <MenuItem key={value} value={value}>
                                {COORD_LIST_LABELS[value]}
                            </MenuItem>
                        ))}
                    </StyledSelect>
                )}
            />

            {/* ------OFFSET X------*/}
            <Controller
                name={'pos_x'}
                control={control}
                render={({ field, formState }) => (
                    <StyledTextField
                        defaultValue={field.value}
                        InputLabelProps={{ shrink: true }}
                        onBlur={(e) => {
                            const val = parseValueAsInt(e.target.value);
                            field.onChange(val);
                            e.target.value = val.toString();
                        }}
                        fullWidth
                        label="Position X"
                        error={!!formState.errors.pos_x}
                        helperText={formState.errors.pos_x?.message}
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end" disableTypography>
                                    px
                                </InputAdornment>
                            ),
                        }}
                    />
                )}
            />

            {/* ------OFFSET Y------*/}
            <Controller
                name={'pos_y'}
                control={control}
                render={({ field, formState }) => (
                    <StyledTextField
                        defaultValue={field.value}
                        InputLabelProps={{ shrink: true }}
                        onBlur={(e) => {
                            const val = parseValueAsInt(e.target.value);
                            field.onChange(val);
                            e.target.value = val.toString();
                        }}
                        fullWidth
                        label="Position Y"
                        error={!!formState.errors.pos_y}
                        helperText={formState.errors.pos_y?.message}
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end" disableTypography>
                                    px
                                </InputAdornment>
                            ),
                        }}
                    />
                )}
            />

            {/* ------SCALE------*/}
            <Controller
                name={'scale'}
                control={control}
                render={({ field, formState }) => (
                    <StyledTextField
                        defaultValue={field.value}
                        fullWidth
                        label="Scale"
                        InputLabelProps={{ shrink: true }}
                        onBlur={(e) => {
                            const val = parseValueAsFloat(e.target.value);
                            field.onChange(val);
                            e.target.value = val.toString();
                        }}
                        error={!!formState.errors.scale}
                        helperText={formState.errors.scale?.message}
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end" disableTypography>
                                    &#37;
                                </InputAdornment>
                            ),
                        }}
                    />
                )}
            />

            {/* ------START TIME------*/}
            <Controller
                name={'start_time'}
                control={control}
                render={({ field, formState }) => (
                    <StyledTextField
                        {...field}
                        fullWidth
                        label="Start time"
                        error={!!formState.errors.start_time}
                        helperText={formState.errors.start_time?.message}
                    />
                )}
            />

            {/* ------GROUP NAME------*/}
            <Controller
                name={'group_name'}
                control={control}
                render={({ field, formState }) => (
                    <StyledTextField
                        {...field}
                        fullWidth
                        label="Group name"
                        error={!!formState.errors.group_name}
                        helperText={formState.errors.group_name?.message}
                    />
                )}
            />

            <Title text="Choose overlay" />

            {/* ------OVERLAY TYPE------*/}
            <Controller
                name={'overlay_type'}
                control={control}
                render={({ field }) => (
                    <RadioGroup
                        row
                        style={{ gridColumn: '2 span' }}
                        value={field.value}
                        onChange={(e) => {
                            field.onChange(e);
                        }}
                    >
                        {OVERLAY_TYPES.map((unit) => (
                            <StyledRadioControlLabel
                                key={unit}
                                value={unit}
                                control={<Radio color="info" />}
                                label={OVERLAY_TYPES_LABELS[unit]}
                            />
                        ))}
                    </RadioGroup>
                )}
            />

            {/* ------GLASS SIZE------*/}
            <Controller
                name={'glass_size'}
                control={control}
                render={({ field, formState }) => (
                    <StyledTextField
                        {...field}
                        fullWidth
                        label="Glass size"
                        onBlur={(e) => {
                            const val = parseValueAsFloat(e.target.value);
                            field.onChange(val);
                            e.target.value = val.toString();
                        }}
                        error={!!formState.errors.glass_size}
                        helperText={formState.errors.glass_size?.message}
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end" disableTypography>
                                    liters
                                </InputAdornment>
                            ),
                        }}
                    />
                )}
            />
        </StyledForm>
    );
};
