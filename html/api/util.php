<?PHP

function randomPasswd($length = 8)
{
    return substr(str_shuffle('1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'), 0, $length);
}

function cropImage($input, $output, $width = 300)
{
	if( file_exists( $input ) )
	{
		$img = new Imagick($input);
		$format = strtolower($img->getImageFormat());
		
		if ($format === 'jpeg')
		{
			$orientation = $img->getImageOrientation();
			$isRotated = false;
			if ($orientation === \Imagick::ORIENTATION_RIGHTTOP) {
				$img->rotateImage('none', 90);
				$isRotated = true;
			} elseif ($orientation === \Imagick::ORIENTATION_BOTTOMRIGHT) {
				$img->rotateImage('none', 180);
				$isRotated = true;
			} elseif ($orientation === \Imagick::ORIENTATION_LEFTBOTTOM) {
				$img->rotateImage('none', 270);
				$isRotated = true;
			}
			if ($isRotated) {
				$img->setImageOrientation(\Imagick::ORIENTATION_TOPLEFT);
			}
		}
		if($img->width > $img->height)
		{
			$img->cropImage($img->height, $img->height, ($img->width - $img->height)/2, 0 );
		}else{
			$img->cropImage($img->width, $img->width, 0, ($img->height - $img->width)/2 );
		}
		if( $img->width > $width)
		{
			$img->thumbnailImage($width, 0);
		}
		$img->writeImage($output);
		$img->destroy();
	}
}

?>