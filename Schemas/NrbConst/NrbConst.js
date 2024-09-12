 define("NrbConst", [], function() {
	/**
	 * Ежедневная периодичность
	 */
	const everydayPeriodicity = "F7752F1F-285B-4AF3-A405-86A1FE4EC611";

	/**
	 * Активная публикация.
	 */
	const activePublication = true;

	/**
	 * Мужской гендер.
	 */
	const maleGender = "EEAC42EE-65B6-DF11-831A-001D60E938C6";

	/**
	 * Минимальный возраст.
	 */
	const minAge = 18;

	const circulationColor = "Yellow";

	return {
		EverydayPeriodicity: everydayPeriodicity,
		ActivePublication: activePublication,
		MinAge: minAge,
		MaleGender: maleGender,
		CirculationColor: circulationColor
	}
 });