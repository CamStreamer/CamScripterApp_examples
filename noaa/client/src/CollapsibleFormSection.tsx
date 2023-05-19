import React, { useRef, useState } from 'react';

import Collapse from '@mui/material/Collapse';
import Divider from '@mui/material/Divider';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Typography from '@mui/material/Typography';
import { styled } from '@mui/material/styles';
import IconButton, { IconButtonProps } from '@mui/material/IconButton';
import Slide from '@mui/material/Slide';
import Box from '@mui/material/Box';
import Fade from '@mui/material/Fade';
import Stack from '@mui/material/Stack';

type Props = {
    children: React.ReactNode;
    label: string;
};

export const CollapsibleFormSection = ({ label, children }: Props) => {
    const [expanded, setExpanded] = useState(false);

    const containerRef = useRef(null);

    const content = (
        <span style={style.textWrapper} onClick={() => setExpanded((prev) => !prev)}>
            <Typography textTransform="uppercase">{label}</Typography>
            <ExpandMore expand={expanded} aria-expanded={expanded} aria-label="show more">
                <ExpandMoreIcon />
            </ExpandMore>
        </span>
    );

    return (
        <Stack spacing={expanded ? 2 : 0}>
            <Box style={style.box} ref={containerRef}>
                {expanded ? (
                    <Slide direction="right" in={expanded} container={containerRef.current}>
                        <Divider orientation="horizontal" textAlign="left">
                            {content}
                        </Divider>
                    </Slide>
                ) : (
                    <Fade in={!expanded}>{content}</Fade>
                )}
            </Box>
            <Collapse in={expanded}>{children}</Collapse>
        </Stack>
    );
};

const style: TStyleSheet = {
    textWrapper: {
        cursor: 'pointer',
        display: 'flex',
        gap: '8px',
        alignItems: 'center',
    },
    box: {
        overflow: 'hidden',
        margin: 0,
    },
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
