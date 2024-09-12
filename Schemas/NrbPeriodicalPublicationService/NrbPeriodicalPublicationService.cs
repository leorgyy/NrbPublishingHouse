using BPMSoft.Web.Common;
using System.ServiceModel.Activation;
using System.ServiceModel;
using System.ServiceModel.Web;
using System;
using BPMSoft.Core.DB;
using BPMSoft.Core;
using BPMSoft.Common;
using BPMSoft.Core.Entities;
using System.Linq;

namespace BPMSoft.Configuration
{
	/// <summary>
	/// Сервис периодических публикаций.
	/// </summary>
	[ServiceContract]
	[AspNetCompatibilityRequirements(RequirementsMode = AspNetCompatibilityRequirementsMode.Required)]
	public class NrbPeriodicalPublicationService : BaseService
	{
		/// <summary>
		/// Id запланированного статуса.
		/// </summary>
		private static readonly string PlannedStatusId = "D974382F-B72E-4C3A-A6FF-6EF3A05BF36E";

		/// <summary>
		/// Получает количество запланированных выпусков.
		/// </summary>
		/// <param name="code">Код издания.</param>
		/// <returns>
		/// Количество запланированнх выпусков издания,
		/// -1 - издание не найдено.
		/// </returns>
		[OperationContract]
		[WebInvoke(
			Method = "POST", UriTemplate = "GetPlannedReleaseCount", BodyStyle = WebMessageBodyStyle.Wrapped,
			RequestFormat = WebMessageFormat.Json, ResponseFormat = WebMessageFormat.Json
		)]
		public int GetPlannedReleaseCount(string code)
		{
			if (GetPeriodicalPublication(code))
			{
				return -1;
			}

			var esq = new EntitySchemaQuery(UserConnection.EntitySchemaManager, "NrbRelease");
			var countColumn = esq.AddColumn(
				esq.CreateAggregationFunction(
					AggregationTypeStrict.Count, "Id"));

			esq.Filters.Add(
				esq.CreateFilterWithParameters(
					FilterComparisonType.Equal, "NrbPeriodicalPublications.NrbCode", code));

			esq.Filters.Add(
				esq.CreateFilterWithParameters(
					FilterComparisonType.Equal, "NrbReleaseState", PlannedStatusId));

			var entity = esq.GetEntityCollection(UserConnection).FirstOrDefault();

			return entity.GetTypedColumnValue<int>(countColumn.Name);
		}

		/// <summary>
		/// Получает периодическое издание.
		/// </summary>
		/// <param name="code">Код издания.</param>
		/// <returns>
		/// True - издание получено,
		/// False - в противном случае.
		/// </returns>
		private bool GetPeriodicalPublication(string code)
		{
			var esq = new EntitySchemaQuery(UserConnection.EntitySchemaManager, "NrbPeriodicalPublications");

			var countColumn = esq.AddColumn(
				esq.CreateAggregationFunction(
					AggregationTypeStrict.Count, "Id"));

			esq.Filters.Add(
				esq.CreateFilterWithParameters(
					FilterComparisonType.Equal, "NrbCode", code));

			var entity = esq.GetEntityCollection(UserConnection).FirstOrDefault();

			return entity.GetTypedColumnValue<int>(countColumn.Name) == 0;
		}
	}
}