import { Control, Controller, useFieldArray, UseFieldArrayRemove } from 'react-hook-form';
import { TServerData } from '../models/schema';
import { MenuItem, Typography, Grid, Button, Divider } from '@mui/material';
import { StyledSelect, StyledTextField } from '../components/FormInputs';
import { PasswordInput } from '../components/PasswordInput';
import DeleteIcon from '@mui/icons-material/Delete';

type Props = {
    index: number;
    control: Control<TServerData>;
    remove: UseFieldArrayRemove;
};
export const FormConnectParams = ({ control, index, remove }: Props) => {
    return (
        <Grid item container rowSpacing={2}>
            <Grid item xs={6}>
                <Controller
                    name={`cameras.${index}.protocol`}
                    control={control}
                    render={({ field }) => (
                        <StyledSelect
                            {...field}
                            onChange={(...e) => {
                                field.onChange(...e);
                            }}
                            label="Protocol"
                        >
                            {PROTOCOLS.map((value) => (
                                <MenuItem key={value} value={value}>
                                    {PROTOCOL_LABELS[value]}
                                </MenuItem>
                            ))}
                        </StyledSelect>
                    )}
                />
            </Grid>
            <Grid item xs={6}>
                <Controller
                    name={`cameras.${index}.ip`}
                    control={control}
                    render={({ field, formState }) => (
                        <StyledTextField
                            {...field}
                            InputLabelProps={{ shrink: true }}
                            fullWidth
                            label="IP address"
                            error={formState.errors.cameras?.[index]?.ip !== undefined}
                            helperText={formState.errors.cameras?.[index]?.ip?.message}
                        />
                    )}
                />
            </Grid>
            <Grid item xs={6}>
                <Controller
                    name={`cameras.${index}.port`}
                    control={control}
                    render={({ field, formState }) => (
                        <StyledTextField
                            defaultValue={field.value}
                            InputLabelProps={{ shrink: true }}
                            fullWidth
                            label="Port"
                            error={formState.errors.cameras?.[index]?.port !== undefined}
                            helperText={formState.errors.cameras?.[index]?.port?.message}
                        />
                    )}
                />
            </Grid>
            <Grid item xs={6}>
                <Controller
                    name={`cameras.${index}.user`}
                    control={control}
                    render={({ field, formState }) => (
                        <StyledTextField
                            {...field}
                            InputLabelProps={{ shrink: true }}
                            fullWidth
                            label="User"
                            error={formState.errors.cameras?.[index]?.user !== undefined}
                            helperText={formState.errors.cameras?.[index]?.user?.message}
                        />
                    )}
                />
            </Grid>
            <Grid item xs={6}>
                <PasswordInput control={control} name={`cameras.${index}.pass`} />
            </Grid>
            <Grid item xs={6}>
                <Button variant="contained" color="error" onClick={() => remove(index)}>
                    <DeleteIcon />
                </Button>
            </Grid>
            <Grid item xs={12}>
                <Divider sx={{ color: 'black' }} />
            </Grid>
        </Grid>
    );
};

type CameraListProps = {
    control: Control<TServerData>;
};

export const CameraList = ({ control }: CameraListProps) => {
    const { fields, append, remove } = useFieldArray({
        control,
        name: 'cameras',
    });

    return (
        <>
            <Grid container direction="column" rowGap={2}>
                {fields.map((item, i) => (
                    <FormConnectParams key={item.id} control={control} index={i} remove={remove} />
                ))}
                <Grid item>
                    <Button
                        variant="contained"
                        color="success"
                        onClick={() => append({ protocol: 'http', ip: '127.0.0.1', port: 80, user: 'root', pass: '' })}
                    >
                        <Typography>Add new camera</Typography>
                    </Button>
                </Grid>
            </Grid>
        </>
    );
};

const PROTOCOL_LABELS: Record<TServerData['cameras'][0]['protocol'], string> = {
    http: 'HTTP',
    https: 'HTTPS',
    https_insecure: 'HTTPS (insecure)',
};
const PROTOCOLS = Object.keys(PROTOCOL_LABELS) as TServerData['cameras'][0]['protocol'][];
