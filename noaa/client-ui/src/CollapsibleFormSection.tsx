import React, { useState } from 'react';

import Collapse from '@mui/material/Collapse';
import Divider from '@mui/material/Divider';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Typography from '@mui/material/Typography';
import { styled } from '@mui/material/styles';
import IconButton, { IconButtonProps } from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import styles from './CollapsibleFormSection.module.css';

type Props = {
    children: React.ReactNode;
    label: string;
};

export const CollapsibleFormSection = ({ label, children }: Props) => {
    const [expanded, setExpanded] = useState(false);

    return (
        <Stack spacing={expanded ? 2 : 0}>
            <span className={styles.textWrapper} onClick={() => setExpanded((prev) => !prev)}>
                <Typography textTransform="uppercase" className="text">
                    {label}
                </Typography>
                <ExpandMore expand={expanded} aria-expanded={expanded} aria-label="show more">
                    <ExpandMoreIcon />
                </ExpandMore>
                <Divider className={styles.divider} orientation="horizontal" />
            </span>
            <Collapse in={expanded} className={styles.collapse}>
                {children}
            </Collapse>
        </Stack>
    );
};

interface ExpandMoreProps extends IconButtonProps {
    expand: boolean;
}

const ExpandMore = styled((props: ExpandMoreProps) => {
    const { expand, ...other } = props;
    return <IconButton {...other} />;
})(({ theme, expand }) => ({
    transform: !expand ? 'rotate(0deg)' : 'rotate(180deg)',
    transition: theme.transitions.create('transform', {
        duration: theme.transitions.duration.shortest,
    }),
}));
