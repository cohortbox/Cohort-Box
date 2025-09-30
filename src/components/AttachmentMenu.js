import { useEffect, useRef, useState } from 'react';
import './AttachmentMenu.css';
import paperClip from '../images/clip.png';

function AttachmentMenu({ setFiles }){
    const btnRef = useRef(null);
    const menuRef = useRef(null);
    const [open, setOpen] = useState(false);

    useEffect(() => {

        function handleClickOutside(e){
            if(
                menuRef.current &&
                !menuRef.current.contains(e.target) &&
                btnRef.current &&
                !btnRef.current.contains(e.target)
            ){
                setOpen(false)
            }
        }

        if(open){
            document.addEventListener('mousedown', handleClickOutside);
        } else {
            document.removeEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [open])

    function handleOpen(e){
        e.preventDefault();
        setOpen(!open);
    }

    return (
        <div className='am-container'>
            <button type='button' ref={btnRef} className='am-btn' onClick={(e) => handleOpen(e)}><img className='am-btn-img' src={paperClip}/></button>
            {
                open && (
                    <div className='am-menu-container' ref={menuRef}>
                        <label for="file-upload" class="custom-file-upload">
                            Add Photos & Videos
                        </label>
                        <input id="file-upload" type="file" accept='image/*, video/*' multiple onChange={(e) => setFiles(e.target.files)}/>
                    </div>
                )
            }
        </div>
    )
}

export default AttachmentMenu;